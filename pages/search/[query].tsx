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
import React from "react";
import { NextPageWithLayout } from "../_app";

type SearchPageProps = {
  authSession: Session;
};

const pageSize = 1;

const SearchPage: NextPageWithLayout<SearchPageProps> = (
  props: SearchPageProps
) => {
  const router = useRouter();
  const searchQuery = router.query.query as string;

  const apiSearchQuery = useInfiniteQuery({
    queryKey: ReadStore.queryKeys.usersBySearchQuery(searchQuery),
    queryFn: ({ pageParam = 1 }) =>
      ReadStore.User.FindPaginated.apiCall(
        {
          filter: { a: { searchQuery } },
          pagination: {
            page: pageParam,
            pageSize,
          },
        },
        props.authSession.access_token
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const usersExist =
    apiSearchQuery.data &&
    apiSearchQuery.data.pages &&
    apiSearchQuery.data.pages.length > 0 &&
    apiSearchQuery.data.pages[0].data &&
    apiSearchQuery.data.pages[0].data.length > 0;

  return (
    <>
      <NavBar
        searchQuery={searchQuery}
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />

      <ContentContainer>
        {apiSearchQuery.isError || usersExist === false ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Image
              alt="network-error"
              src={apiSearchQuery.isError ? SadFaceImg : WindImg}
              width={80}
              height={80}
            />
            <div>
              {apiSearchQuery.isError
                ? "An unexpected error ocurred. Try again later"
                : "No users found"}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-4">
            {apiSearchQuery.isSuccess && (
              <>
                {apiSearchQuery.data.pages?.map((group, idx) => (
                  <React.Fragment key={idx}>
                    {group.data.map((user) => (
                      <UserFoundCard
                        key={user.id}
                        user={user}
                        authSession={props.authSession}
                        router={router}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </>
            )}

            <div>
              <button
                onClick={() => apiSearchQuery.fetchNextPage()}
                disabled={
                  !apiSearchQuery.hasNextPage ||
                  apiSearchQuery.isFetchingNextPage
                }
              >
                {apiSearchQuery.isFetchingNextPage
                  ? "Loading more..."
                  : apiSearchQuery.hasNextPage
                  ? "Load More"
                  : "Nothing more to load"}
              </button>
            </div>
          </div>
        )}
      </ContentContainer>

      <BottomNav authSession={props.authSession} />
    </>
  );
};

export default SearchPage;

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (
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
      const searchQuery = ctx.query.query as string;
      await queryClient.prefetchQuery(
        ReadStore.queryKeys.usersBySearchQuery(searchQuery),
        () =>
          ReadStore.User.FindPaginated.apiCall(
            {
              filter: { a: { searchQuery } },
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

type UserFoundCardProps = {
  user: ReadStore.User.UserModel;
  authSession: Session;
  router: NextRouter;
  searchQuery: string;
};

const UserFoundCard = (props: UserFoundCardProps) => {
  const profilePicture =
    props.user.profilePictureUrl == undefined
      ? AnonymousProfilePicture
      : props.user.profilePictureUrl;

  const queryClient = useQueryClient();

  const apiSendFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Send.Request) =>
      EventStore.FriendRequest.Send.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (response, request) => {
      queryClient.setQueryData<Pagination.Response<ReadStore.User.UserModel>>(
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery),
        (old) => {
          if (old === undefined) return old;
          return produce(old, (draft) => {
            const user = draft.data.find((x) => x.id === request.toUserId);
            if (user !== undefined)
              user.relationshipWithUser.pendingFriendRequest = {
                id: response.friendRequestId,
                isRequestUserReceiver: false,
              };
          });
        }
      );
    },
  });

  const apiCancelFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Cancel.Request) =>
      EventStore.FriendRequest.Cancel.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (_, request) => {
      queryClient.setQueryData<Pagination.Response<ReadStore.User.UserModel>>(
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery),
        (old) => {
          if (old === undefined) return old;
          return produce(old, (draft) => {
            const user = draft.data.find(
              (x) =>
                x.relationshipWithUser.pendingFriendRequest?.id ===
                request.friendRequestId
            );
            if (user !== undefined)
              user.relationshipWithUser.pendingFriendRequest = null;
          });
        }
      );
    },
  });

  const apiAcceptFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Accept.Request) =>
      EventStore.FriendRequest.Accept.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (_, request) => {
      queryClient.setQueryData<Pagination.Response<ReadStore.User.UserModel>>(
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery),
        (old) => {
          if (old === undefined) return old;
          return produce(old, (draft) => {
            const user = draft.data.find(
              (x) =>
                x.relationshipWithUser.pendingFriendRequest?.id ===
                request.friendRequestId
            );
            if (user !== undefined) {
              user.relationshipWithUser.pendingFriendRequest = null;
              user.relationshipWithUser.isFriend = true;
            }
          });
        }
      );
    },
  });

  const apiRejectFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Reject.Request) =>
      EventStore.FriendRequest.Reject.apiCall(
        request,
        props.authSession.access_token
      ),
    onSuccess: (_, request) => {
      queryClient.setQueryData<Pagination.Response<ReadStore.User.UserModel>>(
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery),
        (old) => {
          if (old === undefined) return old;
          return produce(old, (draft) => {
            const user = draft.data.find(
              (x) =>
                x.relationshipWithUser.pendingFriendRequest?.id ===
                request.friendRequestId
            );
            if (user !== undefined)
              user.relationshipWithUser.pendingFriendRequest = null;
          });
        }
      );
    },
  });

  const apiUnfriendUser = useMutation({
    mutationFn: (request: EventStore.User.Unfriend.Request) =>
      EventStore.User.Unfriend.apiCall(request, props.authSession.access_token),
    onSuccess: (_, request) => {
      queryClient.setQueryData<Pagination.Response<ReadStore.User.UserModel>>(
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery),
        (old) => {
          if (old === undefined) return old;
          return produce(old, (draft) => {
            const user = draft.data.find((x) => x.id === request.toUserId);
            if (user !== undefined) user.relationshipWithUser.isFriend = false;
          });
        }
      );
    },
  });

  const isFoundUserRequestUser = props.user.id === props.authSession.user.id;

  const isFoundUserFriend = props.user.relationshipWithUser.isFriend === true;

  const isThereAPendingFriendRequest =
    props.user.relationshipWithUser.pendingFriendRequest !== null;

  const isRequestUserReceiverOfPendingFriendRequest =
    props.user.relationshipWithUser.pendingFriendRequest
      ?.isRequestUserReceiver ?? false;

  const onUserCardClicked = () => {
    props.router.push(`/profile/${props.user.alias}`);
  };

  const onUserCardSendBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiSendFriendRequest.mutate({
      toUserId: props.user.id,
    });
  };

  const onUserCardUnfriendBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiUnfriendUser.mutate({
      toUserId: props.user.id,
    });
  };

  const onUserCardCancelBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiCancelFriendRequest.mutate({
      friendRequestId: props.user.relationshipWithUser.pendingFriendRequest!.id,
    });
  };

  const onUserCardAcceptBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiAcceptFriendRequest.mutate({
      friendRequestId: props.user.relationshipWithUser.pendingFriendRequest!.id,
    });
  };

  const onUserCardRejectBtnClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiRejectFriendRequest.mutate({
      friendRequestId: props.user.relationshipWithUser.pendingFriendRequest!.id,
    });
  };

  return (
    <div
      className="card card-compact bg-base-100 shadow-lg hover:bg-base-200 transition-colors cursor-pointer"
      onClick={onUserCardClicked}
    >
      <div className="card-body flex flex-col">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-20 rounded-full">
              <Image
                alt={props.user.alias}
                src={profilePicture}
                width={100}
                height={100}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-base font-medium">{props.user.name}</div>
            <div className="italic">@{props.user.alias}</div>
          </div>
        </div>

        {isFoundUserRequestUser ? (
          <></>
        ) : isThereAPendingFriendRequest ? (
          isRequestUserReceiverOfPendingFriendRequest ? (
            <div className="flex-1 flex justify-end">
              <button
                className="btn btn-ghost text-primary"
                onClick={onUserCardAcceptBtnClicked}
              >
                {apiAcceptFriendRequest.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Accept
              </button>
              <button
                className="btn btn-ghost text-secondary"
                onClick={onUserCardRejectBtnClicked}
              >
                {apiRejectFriendRequest.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Reject
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost text-secondary"
              onClick={onUserCardCancelBtnClicked}
            >
              {apiCancelFriendRequest.isLoading && (
                <span className="loading loading-spinner" />
              )}
              Cancel Friend Request
            </button>
          )
        ) : isFoundUserFriend ? (
          <button
            className="btn btn-ghost text-secondary"
            onClick={onUserCardUnfriendBtnClicked}
          >
            {apiUnfriendUser.isLoading && (
              <span className="loading loading-spinner" />
            )}
            Unfriend
          </button>
        ) : (
          <button
            className="btn btn-ghost text-primary"
            onClick={onUserCardSendBtnClicked}
          >
            {apiSendFriendRequest.isLoading && (
              <span className="loading loading-spinner" />
            )}
            Add Friend
          </button>
        )}
      </div>
    </div>
  );
};
