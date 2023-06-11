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
import tw from "tailwind-styled-components";
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

      <ContentContainer className="gap-2">
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

        <div className="flex-1 overflow-y-auto">
          {tabIdx === 0 ? (
            <FriendsContent authSession={props.authSession} />
          ) : (
            <FriendRequestsContent authSession={props.authSession} />
          )}
        </div>
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
    <>
      {apiFriends.isError || friendsExist === false ? (
        <ErrorOrNoResultsFound
          errorOcurred={apiFriends.isError}
          label="You have no friends 😭"
        />
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
    </>
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

        <CardBtn $primaryBtn={false} onClick={onUnfriendBtnClicked}>
          {apiUnfriend.isLoading && (
            <span className="loading loading-spinner" />
          )}
          Unfriend
        </CardBtn>
      </div>
    </div>
  );
};

type FriendRequestsContentProps = {
  authSession: Session;
};

const FriendRequestsContent = (props: FriendRequestsContentProps) => {
  const router = useRouter();

  const apiFriendRequests = useInfiniteQuery({
    queryKey: ReadStore.queryKeys.myFriendRequests(),
    queryFn: ({ pageParam = 1 }) =>
      ReadStore.FriendRequest.FindPaginated.apiCall(
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
  });

  const friendRequestsExist =
    apiFriendRequests.data &&
    apiFriendRequests.data.pages &&
    apiFriendRequests.data.pages.length > 0 &&
    apiFriendRequests.data.pages[0].data &&
    apiFriendRequests.data.pages[0].data.length > 0;

  return (
    <>
      {apiFriendRequests.isError || friendRequestsExist === false ? (
        <ErrorOrNoResultsFound
          errorOcurred={apiFriendRequests.isError}
          label="No pending friend requests"
        />
      ) : (
        <div className="flex flex-col justify-center gap-4">
          {apiFriendRequests.isSuccess && (
            <>
              {apiFriendRequests.data.pages?.map((group, idx) => (
                <React.Fragment key={idx}>
                  {group.data.map((friendRequest) => (
                    <FriendRequestFoundCard
                      key={friendRequest.id}
                      authSession={props.authSession}
                      router={router}
                      friendRequest={friendRequest}
                    />
                  ))}
                </React.Fragment>
              ))}
            </>
          )}

          {apiFriendRequests.hasNextPage && (
            <button
              className=" btn btn-primary btn-outline"
              onClick={() => apiFriendRequests.fetchNextPage()}
            >
              Load more
            </button>
          )}
        </div>
      )}
    </>
  );
};

type FriendRequestCardProps = {
  friendRequest: ReadStore.FriendRequest.FriendRequestModel;
  authSession: Session;
  router: NextRouter;
};

const FriendRequestFoundCard = (props: FriendRequestCardProps) => {
  const queryClient = useQueryClient();

  const apiCancelFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Cancel.Request) =>
      EventStore.FriendRequest.Cancel.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (_, request) => {
      queryClient.setQueryData<
        InfiniteData<
          Pagination.Response<ReadStore.FriendRequest.FriendRequestModel>
        >
      >(ReadStore.queryKeys.myFriendRequests(), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const page = draft.pages.find((x) =>
            x.data.some((x) => x.id === request.friendRequestId)
          );
          if (page !== undefined) {
            const idx = page.data.findIndex(
              (x) => x.id === request.friendRequestId
            );
            if (idx !== -1) page.data.splice(idx, 1);
          }
        });
      });
    },
  });

  const apiAcceptFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Accept.Request) =>
      EventStore.FriendRequest.Accept.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (_, request) => {
      queryClient.setQueryData<
        InfiniteData<
          Pagination.Response<ReadStore.FriendRequest.FriendRequestModel>
        >
      >(ReadStore.queryKeys.myFriendRequests(), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const page = draft.pages.find((x) =>
            x.data.some((x) => x.id === request.friendRequestId)
          );
          if (page !== undefined) {
            const idx = page.data.findIndex(
              (x) => x.id === request.friendRequestId
            );
            if (idx !== -1) page.data.splice(idx, 1);
          }
        });
      });
    },
  });

  const apiRejectFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Reject.Request) =>
      EventStore.FriendRequest.Reject.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (_, request) => {
      queryClient.setQueryData<
        InfiniteData<
          Pagination.Response<ReadStore.FriendRequest.FriendRequestModel>
        >
      >(ReadStore.queryKeys.myFriendRequests(), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const page = draft.pages.find((x) =>
            x.data.some((x) => x.id === request.friendRequestId)
          );
          if (page !== undefined) {
            const idx = page.data.findIndex(
              (x) => x.id === request.friendRequestId
            );
            if (idx !== -1) page.data.splice(idx, 1);
          }
        });
      });
    },
  });

  const myUserId = props.authSession.user.id;

  const amIFromUser = props.friendRequest.fromUser.id === myUserId;

  const profilePicture =
    (amIFromUser
      ? props.friendRequest.toUser.profilePictureUrl
      : props.friendRequest.fromUser.profilePictureUrl) ??
    AnonymousProfilePicture;

  const name = amIFromUser
    ? props.friendRequest.toUser.name
    : props.friendRequest.fromUser.name;

  const alias = amIFromUser
    ? props.friendRequest.toUser.alias
    : props.friendRequest.fromUser.alias;

  const onUserCardClicked = () => {
    if (amIFromUser)
      props.router.push(`/profile/${props.friendRequest.toUser.alias}`);
    else props.router.push(`/profile/${props.friendRequest.fromUser.alias}`);
  };

  const onCancelFriendRequestBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiCancelFriendRequest.mutate({ friendRequestId: props.friendRequest.id });
  };

  const onAcceptFriendRequestBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiAcceptFriendRequest.mutate({ friendRequestId: props.friendRequest.id });
  };

  const onRejectFriendRequestBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiRejectFriendRequest.mutate({ friendRequestId: props.friendRequest.id });
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
                alt={props.friendRequest.id}
                src={profilePicture}
                width={100}
                height={100}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-base font-medium">{name}</div>
            <div className="italic">@{alias}</div>
          </div>
        </div>

        {amIFromUser ? (
          <CardBtn
            $primaryBtn={false}
            className="flex-1"
            onClick={onCancelFriendRequestBtnClicked}
          >
            {apiCancelFriendRequest.isLoading && (
              <span className="loading loading-spinner" />
            )}
            Cancel
          </CardBtn>
        ) : (
          <div className="flex-1 flex">
            <CardBtn
              $primaryBtn
              className="flex-1"
              onClick={onAcceptFriendRequestBtnClicked}
            >
              {apiAcceptFriendRequest.isLoading && (
                <span className="loading loading-spinner" />
              )}
              Accept
            </CardBtn>
            <CardBtn
              $primaryBtn={false}
              className="flex-1"
              onClick={onRejectFriendRequestBtnClicked}
            >
              {apiRejectFriendRequest.isLoading && (
                <span className="loading loading-spinner" />
              )}
              Reject
            </CardBtn>
          </div>
        )}
      </div>
    </div>
  );
};

type ErrorOrNoResultsFoundProps = {
  errorOcurred: boolean;
  label: string;
};

const ErrorOrNoResultsFound = (props: ErrorOrNoResultsFoundProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2">
      <Image
        alt="network-error"
        src={props.errorOcurred ? SadFaceImg : WindImg}
        width={80}
        height={80}
      />
      <div>
        {props.errorOcurred
          ? "An unexpected error ocurred. Try again later"
          : props.label}
      </div>
    </div>
  );
};

const CardBtn = tw.button<{ $primaryBtn: boolean }>`
  btn
  border-none
  text-white
  ${(props) => (props.$primaryBtn ? "hover:bg-blue-300" : "hover:bg-red-300")}
  ${(props) => (props.$primaryBtn ? "bg-primary" : "bg-secondary")}
  rounded-none
`;
