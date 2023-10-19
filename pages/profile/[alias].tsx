import BottomNav from "@/components/bottom-nav";
import ContentContainer from "@/components/content-container";
import NavBar from "@/components/navbar";
import PostCard from "@/components/post-card";
import { EventStore, Pagination, ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import WindImg from "@/public/wind.png";
import {
  Session,
  createPagesServerClient,
} from "@supabase/auth-helpers-nextjs";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { NextPageWithLayout } from "../_app";
import ImageFormPicker from "@/components/image-form-picker";
import NameFormInput from "@/components/name-form-input";
import { AxiosError } from "axios";
import { produce } from "immer";

type ProfilePageProps = {
  authSession: Session;
};

const pageSize = 20;

const ProfilePage: NextPageWithLayout<ProfilePageProps> = (
  props: ProfilePageProps
) => {
  const router = useRouter();
  const userAlias = router.query.alias as string;

  const apiUser = useQuery({
    queryKey: ReadStore.queryKeys.userByAlias(userAlias),
    queryFn: () =>
      ReadStore.User.FindOne.apiCall(
        {
          filter: { b: { alias: userAlias } },
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

      <ContentContainer>
        {apiUser.isError || apiUser.data == null ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2">
            <Image
              alt="no-user-found"
              src={apiUser.isError ? SadFaceImg : WindImg}
              width={80}
              height={80}
            />
            <div>
              {apiUser.isError
                ? "An unexpected error ocurred. Try again later"
                : "No user found"}
            </div>
          </div>
        ) : (
          <ProfileUser authSession={props.authSession} user={apiUser.data} />
        )}
      </ContentContainer>

      <BottomNav
        activeTab={
          props.authSession.user.id === apiUser.data?.id ? "profile" : undefined
        }
        authSession={props.authSession}
      />
    </>
  );
};

export default ProfilePage;

export const getServerSideProps: GetServerSideProps<ProfilePageProps> = async (
  ctx
) => {
  const supabase = createPagesServerClient(ctx);
  const sessionRes = await supabase.auth.getSession();
  if (sessionRes.data.session !== null) {
    let authSession: Session | undefined = undefined;
    if (sessionRes.data.session.user.user_metadata.registeredAt !== undefined)
      authSession = sessionRes.data.session;
    else {
      const refreshedSessionRes = await supabase.auth.refreshSession();
      if (refreshedSessionRes.data.session !== null)
        authSession = refreshedSessionRes.data.session;
    }
    if (authSession !== undefined) {
      return {
        props: { authSession },
      };
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};

type ProfileUserProps = {
  user: ReadStore.User.UserModel;
  authSession: Session;
};

const ProfileUser = (props: ProfileUserProps) => {
  const queryClient = useQueryClient()

  const apiPosts = useInfiniteQuery({
    queryKey: ReadStore.queryKeys.userPosts(props.user.id),
    queryFn: ({ pageParam = 1 }) =>
      ReadStore.Post.FindPaginated.apiCall(
        {
          filter: { b: { userId: props.user.id } },
          pagination: {
            page: pageParam,
            pageSize,
          },
        },
        props.authSession.access_token
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const profilePicture =
    props.user.profilePictureUrl ?? AnonymousProfilePicture;

  const postsExist =
    apiPosts.data &&
    apiPosts.data.pages &&
    apiPosts.data.pages.length > 0 &&
    apiPosts.data.pages[0].data &&
    apiPosts.data.pages[0].data.length > 0;

  const onUpdateInfoSuccesful = (newName: string, newProfilePictureUrl?: string) => {
    queryClient.setQueryData<ReadStore.User.UserModel | null>(ReadStore.queryKeys.userByAlias(props.user.alias), (old) => {
      if (old === undefined) return old;
      return produce(old, (draft) => {
        if (draft == null) return old
        draft.name = newName
        draft.profilePictureUrl = newProfilePictureUrl ?? null
      });
    });

    queryClient.setQueryData<ReadStore.User.UserModel | null>(ReadStore.queryKeys.userById(props.user.id), (old) => {
      if (old === undefined) return old;
      return produce(old, (draft) => {
        if (draft == null) return old
        draft.name = newName
        draft.profilePictureUrl = newProfilePictureUrl ?? null
      });
    });

    queryClient.setQueryData<InfiniteData<Pagination.Response<ReadStore.Post.PostModel>> | undefined>(ReadStore.queryKeys.userPosts(props.user.id), (old) => {
      if (old === undefined) return old;
      return produce(old, (draft) => {
        if (draft == null) return old
        for (const page of draft.pages) {
          for (const post of page.data) {
            post.user.name = newName
            post.user.profilePictureUrl = newProfilePictureUrl ?? null
          }
        }
      });
    });

    (document.getElementById('edit-info-modal')! as any).close()
  }

  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex flex-col items-center">
        <div className="avatar">
          <div className="w-20 rounded-full">
            <Image
              alt={props.user.alias}
              src={profilePicture}
              width={80}
              height={80}
            />
          </div>
        </div>
        <div className="text-base font-medium">{props.user.name}</div>
        <div className="italic">@{props.user.alias}</div>
      </div>

      <dialog id="edit-info-modal" className="modal">
        <div className="modal-box">
          <EditUserInfoForm
            authSession={props.authSession}
            name={props.user.name}
            onSuccessMutation={onUpdateInfoSuccesful}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <button
        className="btn btn-primary"
        onClick={() => (document.getElementById('edit-info-modal')! as any).showModal()}
      >
        Edit Profile
      </button>

      {apiPosts.isError || postsExist === false ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Image
            alt="network-error"
            src={apiPosts.isError ? SadFaceImg : WindImg}
            width={80}
            height={80}
          />
          <div>
            {apiPosts.isError
              ? "An unexpected error ocurred. Try again later"
              : "No posts found"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {apiPosts.isSuccess && (
            <>
              {apiPosts.data.pages.map((group, idx) => (
                <React.Fragment key={idx}>
                  {group.data.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </React.Fragment>
              ))}
            </>
          )}
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
  );
};

type EditUserInfoFormProps = {
  authSession: Session;
  name: string
  onSuccessMutation: (newName: string, newProfilePictureUrl?: string) => void
}

const EditUserInfoForm = (props: EditUserInfoFormProps) => {
  const [name, setName] = useState(props.name);
  const [nameError, setNameError] = useState("");

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureError, setProfilePictureError] = useState("");

  const [apiMutationError, setApiMutationError] = useState("");

  const apiUpdateUserInfo = useMutation({
    mutationFn: (request: EventStore.User.UpdateInfo.Request) =>
      EventStore.User.UpdateInfo.apiCall(request, props.authSession.access_token),
    onSuccess: (response, request) => {
      setApiMutationError("");
      props.onSuccessMutation(request.name, response.profilePictureUrl);
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

  const anyInputErrors = nameError !== "" || profilePictureError !== ""
  const emptyInputs = name === "" && profilePicture === null

  const disableFormSubmitBtn =
    anyInputErrors || apiUpdateUserInfo.isLoading || emptyInputs;

  const onClickSubmitForm = (e: React.MouseEvent) => {
    e.preventDefault();
    apiUpdateUserInfo.mutate({ name, profilePicture });
  };

  return (
    <>
      <h3 className="font-bold text-lg">Edit your info</h3>

      <NameFormInput
        label="Your name"
        required={false}
        name={name}
        setName={setName}
        nameError={nameError}
        setNameError={setNameError}
      />

      <ImageFormPicker
        label="Your profile picture"
        profilePicture={profilePicture}
        setProfilePicture={setProfilePicture}
        profilePictureError={profilePictureError}
        setProfilePictureError={setProfilePictureError}
      />

      <div className="text-error">{apiMutationError}</div>

      <div className="modal-action">
        <button
          className="btn btn-primary btn-outline"
          disabled={disableFormSubmitBtn}
          onClick={onClickSubmitForm}
        >
          {apiUpdateUserInfo.isLoading && (
            <span className="loading loading-spinner" />
          )}
          Submit
        </button>
        <form method="dialog">
          <button className="btn">Close</button>
        </form>
      </div>
    </>
  )
}