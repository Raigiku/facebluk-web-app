import BottomNav from "@/components/bottom-nav";
import ContentContainer from "@/components/content-container";
import NavBar from "@/components/navbar";
import PostCard from "@/components/post-card";
import { ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import WindImg from "@/public/wind.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-react";
import {
  QueryClient,
  dehydrate,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";
import { NextPageWithLayout } from "../_app";

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
  const supabase = createServerSupabaseClient(ctx);
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
      const queryClient = new QueryClient();
      const aliasQuery = ctx.query.alias as string;
      await queryClient.prefetchQuery(
        ReadStore.queryKeys.userByAlias(aliasQuery),
        () =>
          ReadStore.User.FindOne.apiCall(
            {
              filter: { b: { alias: aliasQuery } },
            },
            authSession!.access_token
          )
      );
      return {
        props: { authSession, dehydratedState: dehydrate(queryClient) },
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
