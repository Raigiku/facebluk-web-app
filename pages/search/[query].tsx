import NavBar from "@/components/navbar";
import { EventStore, Pagination, ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import {
  QueryClient,
  dehydrate,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { produce } from "immer";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { NextRouter, useRouter } from "next/router";
import { useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { NextPageWithLayout } from "../_app";

type SearchPageProps = {
  authSession: Session;
};

const pageSize = 5;

const SearchPage: NextPageWithLayout<SearchPageProps> = (
  props: SearchPageProps
) => {
  const router = useRouter();
  const searchQuery = router.query.query as string;

  const [page, setPage] = useState(1);

  const apiSearchQuery = useQuery({
    queryKey: ReadStore.queryKeys.usersBySearchQuery(searchQuery, page),
    queryFn: () =>
      ReadStore.User.FindPaginated.apiCall(
        {
          filter: { a: { searchQuery } },
          pagination: {
            page,
            pageSize,
          },
        },
        props.authSession.access_token
      ),
    keepPreviousData: true,
  });

  const nextPageClicked = async () => {
    setPage((prev) => prev + 1);
  };

  const prevPageClicked = () => {
    setPage((prev) => prev - 1);
  };

  const blurUsers = apiSearchQuery.isPreviousData ? "blur" : "";

  const enableNextPageBtn =
    apiSearchQuery.data !== undefined ? apiSearchQuery.data.hasMoreData : false;

  return (
    <>
      <NavBar
        searchQuery={router.query.query as string}
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />
      <div className="flex-1 p-8 grid grid-cols-4">
        {apiSearchQuery.data === undefined ||
        apiSearchQuery.data.data.length === 0 ? (
          <div className="col-start-2 col-end-4 flex flex-col items-center justify-center gap-2">
            <Image
              alt="network-error"
              src={SadFaceImg}
              width={80}
              height={80}
            />
            <div>
              {apiSearchQuery.data === undefined
                ? "An unexpected error ocurred. Try again later"
                : "No users found"}
            </div>
          </div>
        ) : (
          <>
            {page > 1 && (
              <div className="flex items-center justify-end pr-8">
                <button
                  className="btn btn-circle btn-outline"
                  onClick={prevPageClicked}
                >
                  <BsChevronLeft />
                </button>
              </div>
            )}

            <div className="col-start-2 col-end-4">
              <div
                className={`flex flex-col justify-center gap-4 ${blurUsers}`}
              >
                {apiSearchQuery.isSuccess && (
                  <>
                    {apiSearchQuery.data?.data.map((user) => (
                      <UserFoundCard
                        key={user.id}
                        user={user}
                        authSession={props.authSession}
                        router={router}
                        page={page}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {enableNextPageBtn && (
              <div className="flex items-center pl-8">
                <button
                  className="btn btn-circle btn-outline"
                  onClick={nextPageClicked}
                >
                  <BsChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
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
        ReadStore.queryKeys.usersBySearchQuery(searchQuery, 1),
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
  page: number;
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
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery, props.page),
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
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery, props.page),
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
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery, props.page),
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
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery, props.page),
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
        ReadStore.queryKeys.usersBySearchQuery(props.searchQuery, props.page),
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
      <div className="card-body flex flex-row gap-4 items-center">
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

        {isFoundUserRequestUser ? (
          <></>
        ) : isThereAPendingFriendRequest ? (
          isRequestUserReceiverOfPendingFriendRequest ? (
            <div className="flex-1 flex justify-end">
              <button
                className={`btn btn-ghost text-primary ${
                  apiAcceptFriendRequest.isLoading ? "loading" : ""
                }`}
                onClick={onUserCardAcceptBtnClicked}
              >
                Accept
              </button>
              <button
                className={`btn btn-ghost text-secondary ${
                  apiRejectFriendRequest.isLoading ? "loading" : ""
                }`}
                onClick={onUserCardRejectBtnClicked}
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="flex-1 flex justify-end">
              <button
                className={`btn btn-ghost text-secondary ${
                  apiCancelFriendRequest.isLoading ? "loading" : ""
                }`}
                onClick={onUserCardCancelBtnClicked}
              >
                Cancel Friend Request
              </button>
            </div>
          )
        ) : isFoundUserFriend ? (
          <div className="flex-1 flex justify-end">
            <button
              className={`btn btn-ghost text-secondary ${
                apiUnfriendUser.isLoading ? "loading" : ""
              }`}
              onClick={onUserCardUnfriendBtnClicked}
            >
              Unfriend
            </button>
          </div>
        ) : (
          <div className="flex-1 flex justify-end">
            <button
              className={`btn btn-ghost text-primary ${
                apiSendFriendRequest.isLoading ? "loading" : ""
              }`}
              onClick={onUserCardSendBtnClicked}
            >
              Add Friend
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
