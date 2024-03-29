import BottomNav from "@/components/bottom-nav";
import ContentContainer from "@/components/content-container";
import ImageFormPicker from "@/components/image-form-picker";
import NameFormInput from "@/components/name-form-input";
import NavBar from "@/components/navbar";
import PostCard from "@/components/post-card";
import { EventStore, Pagination, ReadStore } from "@/external-apis";
import {
  Session,
  createPagesServerClient,
} from "@supabase/auth-helpers-nextjs";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { produce } from "immer";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";

type HomePageProps = {
  authSession: Session;
};

const pageSize = 20;

const HomePage = (props: HomePageProps) => {
  const [needsPersonalInfo, setNeedsPersonalInfo] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    if (props.authSession.user.user_metadata.registeredAt === undefined)
      setNeedsPersonalInfo(true);
    else setNeedsPersonalInfo(false);
  }, [props.authSession]);

  const apiPosts = useInfiniteQuery({
    queryKey: ReadStore.queryKeys.homePosts(),
    queryFn: ({ pageParam = 1 }) =>
      ReadStore.Post.FindPaginated.apiCall(
        {
          filter: { a: { placeholder: true } },
          pagination: {
            page: pageParam,
            pageSize,
          },
        },
        props.authSession.access_token
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: needsPersonalInfo === false,
  });

  const onSuccessRegisterMutation = () => {
    setNeedsPersonalInfo(false);
  };

  return (
    <>
      <NavBar
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />

      <ContentContainer>
        {needsPersonalInfo !== undefined && (
          <InfoForm
            authSession={props.authSession}
            needsPersonalInfo={needsPersonalInfo}
            onSuccessRegisterMutation={onSuccessRegisterMutation}
          />
        )}
        <WritePostForm authSession={props.authSession} />

        <div className="flex flex-col gap-2">
          <button
            className=" btn btn-primary btn-outline"
            onClick={() => (window as any).post_modal.showModal()}
          >
            Write a Post 🚀
          </button>

          {apiPosts.isSuccess && (
            <div className="flex flex-col gap-4">
              {apiPosts.data.pages.map((group, idx) => (
                <React.Fragment key={idx}>
                  {group.data.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}

          {apiPosts.hasNextPage && (
            <button
              className=" btn btn-primary btn-outline"
              onClick={() => apiPosts.fetchNextPage()}
            >
              Load more
            </button>
          )}
        </div>
      </ContentContainer>

      <BottomNav activeTab="home" authSession={props.authSession} />
    </>
  );
};

export default HomePage;

type InfoFormProps = {
  authSession: Session;
  needsPersonalInfo: boolean;
  onSuccessRegisterMutation: () => void;
};

const InfoForm = (props: InfoFormProps) => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({
        queryKey: ReadStore.queryKeys.userById(props.authSession.user.id),
      });
      setApiMutationError("");
      props.onSuccessRegisterMutation();
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
    const alphanumericRegex = /^[a-z0-9]+$/i;
    if (alias.length === 0) setAliasError("Required");
    else if (!alphanumericRegex.test(alias))
      setAliasError("Only alphanumeric characters");
    else setAliasError("");
  }, [alias]);

  const onClickSubmitForm = (e: React.MouseEvent) => {
    e.preventDefault();
    apiSubmitUserRegister.mutate({ name, profilePicture, alias });
  };

  const anyInputErrors = nameError !== "" || aliasError !== "" || profilePictureError !== "";

  const disableFormSubmitBtn =
    anyInputErrors || apiSubmitUserRegister.isLoading;

  return (
    <>
      <input
        type="checkbox"
        id="info-modal"
        className="modal-toggle"
        checked={props.needsPersonalInfo}
        readOnly={true}
      />
      <div className="modal">
        <div className="modal-box">
          <h1 className="font-bold text-lg">Welcome to Facebluk!</h1>

          <NameFormInput
            label="What is your name?"
            required
            name={name}
            setName={setName}
            nameError={nameError}
            setNameError={setNameError}
          />

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
              <span className="label-text-alt text-error min-h-1">
                {aliasError}
              </span>
            </label>
          </div>

          <ImageFormPicker
            label="Upload your profile picture"
            profilePicture={profilePicture}
            setProfilePicture={setProfilePicture}
            profilePictureError={profilePictureError}
            setProfilePictureError={setProfilePictureError}
          />

          <div className="text-error">{apiMutationError}</div>

          <div className="modal-action">
            <button
              className="btn btn-primary btn-outline flex-1"
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
  const queryClient = useQueryClient();
  const apiMyUser = useQuery({
    queryKey: ReadStore.queryKeys.userById(props.authSession.user.id),
    queryFn: () =>
      ReadStore.User.FindOne.apiCall(
        { filter: { a: { id: props.authSession.user.id } } },
        props.authSession.access_token
      ),
  });

  const [description, setDescription] = useState("");
  const [apiMutationError, setApiMutationError] = useState("");

  const apiSubmitPost = useMutation({
    mutationFn: (request: EventStore.Post.Create.Request) =>
      EventStore.Post.Create.apiCall(request, props.authSession.access_token),
    onSuccess: (response, request) => {
      (window as any).post_modal.close();

      queryClient.setQueryData<
        InfiniteData<Pagination.Response<ReadStore.Post.PostModel>>
      >(ReadStore.queryKeys.homePosts(), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const newPost: ReadStore.Post.PostModel = {
            id: response.postId,
            description: request.description,
            user: {
              id: apiMyUser.data!.id,
              alias: apiMyUser.data!.alias,
              name: apiMyUser.data!.name,
              profilePictureUrl: apiMyUser.data!.profilePictureUrl,
            },
          };
          if (draft.pages.length === 0)
            draft.pages.push({
              nextPage: 2,
              data: [newPost],
            });
          else if (draft.pages.length > 0) draft.pages[0].data.unshift(newPost);
        });
      });

      setApiMutationError("");
      setDescription("");
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
    apiSubmitPost.mutate({ description, taggedUserIds: [] });
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

        <div className="text-error">{apiMutationError}</div>

        <button
          className={`btn btn-outline btn-primary ${submitFormDisableClass}`}
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
  const supabase = createPagesServerClient(ctx);
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
