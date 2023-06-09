import BottomNav from "@/components/bottom-nav";
import ContentContainer from "@/components/content-container";
import NavBar from "@/components/navbar";
import { EventStore, Pagination, ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import WindImg from "@/public/wind.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import {
  InfiniteData,
  QueryClient,
  dehydrate,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { produce } from "immer";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { NextRouter, useRouter } from "next/router";
import React, { useState } from "react";
import { NextPageWithLayout } from "./_app";

type FriendsPageProps = {
  authSession: Session;
};

const pageSize = 20;

const FriendsPage: NextPageWithLayout<FriendsPageProps> = (
  props: FriendsPageProps
) => {
  const [tabIdx, setTabIdx] = useState(0);

  return (
    <>
      <NavBar
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />

      <ContentContainer>
        <div className="tabs flex tabs-boxed">
          <div
            className={`flex-1 tab ${tabIdx === 0 ? "tab-active" : ""}`}
            onClick={() => setTabIdx(0)}
          >
            Friends
          </div>
          <div
            className={`flex-1 tab ${tabIdx === 1 ? "tab-active" : ""}`}
            onClick={() => setTabIdx(1)}
          >
            Requests
          </div>
        </div>

        {tabIdx === 0 && <FriendsContent authSession={props.authSession} />}
      </ContentContainer>

      <BottomNav activeTab="friends" authSession={props.authSession} />
    </>
  );
};

export default FriendsPage;

export const getServerSideProps: GetServerSideProps<FriendsPageProps> = async (
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
      await queryClient.prefetchQuery(ReadStore.queryKeys.myFriends(), () =>
        ReadStore.User.FindPaginated.apiCall(
          {
            filter: { b: { placeholder: true } },
            pagination: {
              page: 1,
              pageSize,
            },
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

type FriendsContentProps = {
  authSession: Session;
};

const FriendsContent = (props: FriendsContentProps) => {
  const router = useRouter();

  const apiFriends = useInfiniteQuery({
    queryKey: ReadStore.queryKeys.myFriends(),
    queryFn: ({ pageParam = 1 }) =>
      ReadStore.User.FindPaginated.apiCall(
        {
          filter: { b: { placeholder: true } },
          pagination: {
            page: pageParam,
            pageSize,
          },
        },
        props.authSession.access_token
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const friendsExist =
    apiFriends.data &&
    apiFriends.data.pages &&
    apiFriends.data.pages.length > 0 &&
    apiFriends.data.pages[0].data &&
    apiFriends.data.pages[0].data.length > 0;

  return (
    <div>
      {apiFriends.isError || friendsExist === false ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Image
            alt="network-error"
            src={apiFriends.isError ? SadFaceImg : WindImg}
            width={80}
            height={80}
          />
          <div>
            {apiFriends.isError
              ? "An unexpected error ocurred. Try again later"
              : "You have no friends"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center gap-4">
          {apiFriends.isSuccess && (
            <>
              {apiFriends.data.pages?.map((group, idx) => (
                <React.Fragment key={idx}>
                  {group.data.map((user) => (
                    <FriendFoundCard
                      key={user.id}
                      authSession={props.authSession}
                      router={router}
                      friend={user}
                    />
                  ))}
                </React.Fragment>
              ))}
            </>
          )}

          {apiFriends.hasNextPage && (
            <button
              className=" btn btn-primary btn-outline"
              onClick={() => apiFriends.fetchNextPage()}
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

type FriendCardProps = {
  friend: ReadStore.User.UserModel;
  authSession: Session;
  router: NextRouter;
};

const FriendFoundCard = (props: FriendCardProps) => {
  const queryClient = useQueryClient();

  const apiUnfriend = useMutation({
    mutationFn: (request: EventStore.User.Unfriend.Request) =>
      EventStore.User.Unfriend.apiCall(request, props.authSession.access_token),
    onSuccess: (_, request) => {
      queryClient.setQueryData<
        InfiniteData<Pagination.Response<ReadStore.User.UserModel>>
      >(ReadStore.queryKeys.myFriends(), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const page = draft.pages.find((x) =>
            x.data.some((x) => x.id === request.toUserId)
          );
          if (page !== undefined) {
            const idx = page.data.findIndex((x) => x.id === request.toUserId);
            if (idx !== -1) page.data.splice(idx, 1);
          }
        });
      });
    },
  });

  const profilePicture =
    props.friend.profilePictureUrl ?? AnonymousProfilePicture;

  const onUserCardClicked = () => {
    props.router.push(`/profile/${props.friend.alias}`);
  };

  const onUnfriendBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiUnfriend.mutate({ toUserId: props.friend.id });
  };

  return (
    <div
      className="card bg-base-100 shadow-md overflow-hidden"
      onClick={onUserCardClicked}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 p-4 hover:bg-base-200 transition-colors cursor-pointer">
          <div className="avatar">
            <div className="w-14 rounded-full">
              <Image
                alt={props.friend.alias}
                src={profilePicture}
                width={100}
                height={100}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-base font-medium">{props.friend.name}</div>
            <div className="italic">@{props.friend.alias}</div>
          </div>
        </div>

        <button
          className="btn border-none text-white hover:bg-red-300 bg-secondary rounded-none"
          onClick={onUnfriendBtnClicked}
        >
          {apiUnfriend.isLoading && (
            <span className="loading loading-spinner" />
          )}
          Unfriend
        </button>
      </div>
    </div>
  );
};
