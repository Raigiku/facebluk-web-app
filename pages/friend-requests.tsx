import NavBar from "@/components/navbar";
import { EventStore, Pagination, ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import WindImg from "@/public/wind.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-react";
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
import { NextPageWithLayout } from "./_app";

type FriendRequestsPageProps = {
  authSession: Session;
};

const pageSize = 5;

const FriendRequestsPage: NextPageWithLayout<FriendRequestsPageProps> = (
  props: FriendRequestsPageProps
) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const apiFriendRequests = useQuery({
    queryKey: ReadStore.queryKeys.myFriendRequestsPage(page),
    queryFn: () =>
      ReadStore.FriendRequest.FindPaginated.apiCall(
        {
          filter: { a: { placeholder: true } },
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

  const blurUsers = apiFriendRequests.isPreviousData ? "blur" : "";

  const enableNextPageBtn =false
    // apiFriendRequests.data !== undefined
    //   ? apiFriendRequests.data.hasMoreData
    //   : false;

  const apiErrorOrNoResults =
    apiFriendRequests.isError || apiFriendRequests.data?.data.length === 0;

  return (
    <>
      <NavBar
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />
      <div className="flex-1 p-8 grid grid-cols-4">
        {apiErrorOrNoResults ? (
          <ErrorOrNoResultsFound errorOcurred={apiFriendRequests.isError} />
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
                {apiFriendRequests.data?.data.map((x) => (
                  <FriendRequestFoundCard
                    key={x.id}
                    authSession={props.authSession}
                    router={router}
                    friendRequest={x}
                    page={page}
                  />
                ))}
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

export default FriendRequestsPage;

export const getServerSideProps: GetServerSideProps<
  FriendRequestsPageProps
> = async (ctx) => {
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
      await queryClient.prefetchQuery(
        ReadStore.queryKeys.myFriendRequestsPage(1),
        () =>
          ReadStore.FriendRequest.FindPaginated.apiCall(
            {
              filter: { a: { placeholder: true } },
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

type FriendRequestCardProps = {
  friendRequest: ReadStore.FriendRequest.FriendRequestModel;
  authSession: Session;
  router: NextRouter;
  page: number;
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
        Pagination.Response<ReadStore.FriendRequest.FriendRequestModel>
      >(ReadStore.queryKeys.myFriendRequestsPage(props.page), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const idx = draft.data.findIndex(
            (x) => x.id === request.friendRequestId
          );
          if (idx !== -1) draft.data.splice(idx, 1);
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
        Pagination.Response<ReadStore.FriendRequest.FriendRequestModel>
      >(ReadStore.queryKeys.myFriendRequestsPage(props.page), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const idx = draft.data.findIndex(
            (x) => x.id === request.friendRequestId
          );
          if (idx !== -1) draft.data.splice(idx, 1);
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
        Pagination.Response<ReadStore.FriendRequest.FriendRequestModel>
      >(ReadStore.queryKeys.myFriendRequestsPage(props.page), (old) => {
        if (old === undefined) return old;
        return produce(old, (draft) => {
          const idx = draft.data.findIndex(
            (x) => x.id === request.friendRequestId
          );
          if (idx !== -1) draft.data.splice(idx, 1);
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
      className="card card-compact bg-base-100 shadow-lg hover:bg-base-200 transition-colors cursor-pointer"
      onClick={onUserCardClicked}
    >
      <div className="card-body flex flex-row gap-4 items-center">
        <div className="avatar">
          <div className="w-20 rounded-full">
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
        <div className="flex-1 flex justify-end">
          {amIFromUser ? (
            <button
              className="btn btn-ghost text-secondary"
              onClick={onCancelFriendRequestBtnClicked}
            >
              {apiCancelFriendRequest.isLoading && (
                <span className="loading loading-spinner" />
              )}
              Cancel Friend Request
            </button>
          ) : (
            <div>
              <button
                className="btn btn-ghost text-primary"
                onClick={onAcceptFriendRequestBtnClicked}
              >
                {apiAcceptFriendRequest.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Accept
              </button>
              <button
                className="btn btn-ghost text-secondary"
                onClick={onRejectFriendRequestBtnClicked}
              >
                {apiRejectFriendRequest.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type ErrorOrNoResultsFoundProps = {
  errorOcurred: boolean;
};

const ErrorOrNoResultsFound = (props: ErrorOrNoResultsFoundProps) => {
  return (
    <div className="col-start-2 col-end-4 flex flex-col items-center justify-center gap-2">
      <Image
        alt="network-error"
        src={props.errorOcurred ? SadFaceImg : WindImg}
        width={80}
        height={80}
      />
      <div>
        {props.errorOcurred
          ? "An unexpected error ocurred. Try again later"
          : "No friend requests found"}
      </div>
    </div>
  );
};
