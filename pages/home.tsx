import NavBar from "@/components/navbar";
import { EventStore, ReadStore } from "@/external-apis";
import {
  Session,
  createServerSupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { FcInfo } from "react-icons/fc";

type HomePageProps = {
  authSession: Session;
};

const HomePage = (props: HomePageProps) => {
  const apiPosts = useQuery({
    queryKey: ReadStore.queryKeys.homePosts(1),
    queryFn: () =>
      ReadStore.Post.FindPaginated.apiCall(
        {
          filter: { a: { placeholder: true } },
          pagination: {
            page: 1,
            pageSize: 20,
          },
        },
        props.authSession.access_token
      ),
  });

  return (
    <>
      <NavBar
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />
      <div className="flex-1 flex flex-col">
        <InfoForm authSession={props.authSession} />
        <WritePostForm authSession={props.authSession} />

        <div className="flex-1 flex flex-col items-center p-2 gap-2">
          <button
            className=" btn btn-primary btn-outline"
            onClick={() => (window as any).post_modal.showModal()}
          >
            Write a Post 🚀
          </button>
          <div className="flex flex-col">
            {apiPosts.data?.data.map((post) => (
              <div key={post.id}>
                <div>{post.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;

type InfoFormProps = {
  authSession: Session;
};

const InfoForm = (props: InfoFormProps) => {
  const [isInfoModalActive, setIsInfoModalActive] = useState(false);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("Required");

  const [alias, setAlias] = useState("");
  const [aliasError, setAliasError] = useState("Required");

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureError, setProfilePictureError] = useState("");

  const [apiMutationError, setApiMutationError] = useState("");

  const apiSubmitUserRegister = useMutation({
    mutationFn: (request: EventStore.User.Register.Request) =>
      EventStore.User.Register.apiCall(request, props.authSession.access_token),
    onSuccess: () => {
      setIsInfoModalActive(false);
      setApiMutationError("");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response !== undefined) {
          const res = err.response.data as EventStore.FaceblukApiError;
          setApiMutationError(res.message);
        } else {
          setApiMutationError(err.message);
        }
      }
    },
  });

  useEffect(() => {
    if (props.authSession.user.user_metadata.registeredAt === undefined)
      setIsInfoModalActive(true);
  }, [props.authSession]);

  useEffect(() => {
    if (name.length === 0) setNameError("Required");
    else setNameError("");
  }, [name]);

  useEffect(() => {
    const alphanumericRegex = /^[a-z0-9]+$/i;
    if (alias.length === 0) setAliasError("Required");
    else if (!alphanumericRegex.test(alias))
      setAliasError("Only alphanumeric characters");
    else setAliasError("");
  }, [alias]);

  useEffect(() => {
    const allowedExtensions = ["image/png", "image/jpg", "image/jpeg"];
    if (
      profilePicture !== null &&
      !allowedExtensions.includes(profilePicture.type)
    ) {
      setProfilePictureError("Not allowed extension");
    } else setProfilePictureError("");
  }, [profilePicture]);

  const onClickSubmitForm = (e: React.MouseEvent) => {
    e.preventDefault();
    apiSubmitUserRegister.mutate({ name, profilePicture, alias });
  };

  const anyInputErrors = nameError !== "" || aliasError !== "";

  const disableFormSubmitBtn =
    anyInputErrors || apiSubmitUserRegister.isLoading;

  return (
    <>
      <input
        type="checkbox"
        id="info-modal"
        className="modal-toggle"
        checked={isInfoModalActive}
        readOnly={true}
      />
      <div className="modal">
        <div className="modal-box">
          <h1 className="font-bold text-lg">Welcome to Facebluk!</h1>

          <div className="form-control">
            <label className="label">
              <span className="label-text">What is your name?</span>
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered"
              value={name}
              onChange={(e) => {
                setName(e.currentTarget.value);
              }}
            />
            <label className="label">
              <span className="label-text-alt text-secondary min-h-1">
                {nameError}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Give yourself an alias!</span>
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered"
              value={alias}
              onChange={(e) => {
                setAlias(e.currentTarget.value);
              }}
            />
            <label className="label">
              <span className="label-text-alt text-secondary min-h-1">
                {aliasError}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <div className="flex gap-1 items-center">
                <span className="label-text">Upload your profile picture</span>
                <div
                  className="tooltip"
                  data-tip="only allowed .jpeg .jpg .png"
                >
                  <FcInfo />
                </div>
              </div>
            </label>
            <input
              type="file"
              className="file-input file-input-bordered"
              onChange={(e) => {
                if (e.currentTarget.files === null) setProfilePicture(null);
                else setProfilePicture(e.currentTarget.files[0]);
              }}
            />
            <label className="label">
              <span className="label-text-alt text-secondary min-h-1">
                {profilePictureError}
              </span>
            </label>
          </div>

          <div className="text-secondary">{apiMutationError}</div>

          <div className="modal-action">
            <button
              className="btn border-transparent"
              disabled={disableFormSubmitBtn}
              onClick={onClickSubmitForm}
            >
              {apiSubmitUserRegister.isLoading && (
                <span className="loading loading-spinner" />
              )}
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

type WritePostFormProps = {
  authSession: Session;
};

const WritePostForm = (props: WritePostFormProps) => {
  const [description, setDescription] = useState("");

  const [apiMutationError, setApiMutationError] = useState("");

  const apiSubmitPost = useMutation({
    mutationFn: (request: EventStore.Post.Create.Request) =>
      EventStore.Post.Create.apiCall(request, props.authSession.access_token),
    onSuccess: () => {
      (window as any).post_modal.close();
      setApiMutationError("");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response !== undefined) {
          const res = err.response.data as EventStore.FaceblukApiError;
          setApiMutationError(res.message);
        } else {
          setApiMutationError(err.message);
        }
      }
    },
  });

  const onClickSubmitForm = (e: React.MouseEvent) => {
    e.preventDefault();
    apiSubmitPost.mutate({ description });
  };

  const submitFormDisableClass =
    apiSubmitPost.isLoading || description.length === 0 ? "btn-disabled" : "";

  return (
    <dialog id="post_modal" className="modal">
      <form method="dialog" className="modal-box flex flex-col gap-4">
        <h1 className="font-bold text-lg">What do you want to write?</h1>

        <div className="form-control">
          <textarea
            className="textarea textarea-bordered h-64"
            placeholder="Type here"
            value={description}
            onChange={(e) => {
              setDescription(e.currentTarget.value);
            }}
          />
        </div>

        <div className="text-secondary">{apiMutationError}</div>

        <button
          className={`btn ${submitFormDisableClass}`}
          onClick={onClickSubmitForm}
        >
          {apiSubmitPost.isLoading && (
            <span className="loading loading-spinner" />
          )}
          Submit
        </button>
      </form>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (
  ctx
) => {
  const supabase = createServerSupabaseClient(ctx);
  const sessionRes = await supabase.auth.getSession();
  if (sessionRes.data.session !== null) {
    if (sessionRes.data.session.user.user_metadata.registeredAt !== undefined)
      return { props: { authSession: sessionRes.data.session } };
    else {
      const refreshedSessionRes = await supabase.auth.refreshSession();
      if (refreshedSessionRes.data.session !== null)
        return { props: { authSession: refreshedSessionRes.data.session } };
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};
