import NavBar from "@/components/navbar";
import { EventStore, PaginationResponse, ReadStore } from "@/external-apis";
import { FriendRequest } from "@/external-apis/read-store";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import WindImg from "@/public/wind.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { NextRouter, useRouter } from "next/router";
import { useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { NextPageWithLayout } from "./_app";

type FriendRequestsPageProps = {
  authSession: Session;
  friendRequestsResponse?: PaginationResponse<FriendRequest.FriendRequestModel>;
};

const pageSize = 5;

const FriendRequestsPage: NextPageWithLayout<FriendRequestsPageProps> = (
  props: FriendRequestsPageProps
) => {
  const router = useRouter();
  const userId = props.authSession.user.id;
  const [page, setPage] = useState(1);

  const apiFriendRequests = useQuery({
    queryKey: [ReadStore.queryKeys.friendRequest, page],
    queryFn: () =>
      ReadStore.FriendRequest.GetMany.apiCall({
        filter: { a: { userId } },
        page,
        pageSize,
      }),
    initialData: page === 1 ? props.friendRequestsResponse : undefined,
    enabled: props.friendRequestsResponse !== undefined,
    keepPreviousData: true,
  });

  const nextPageClicked = async () => {
    setPage((prev) => prev + 1);
  };

  const prevPageClicked = () => {
    setPage((prev) => prev - 1);
  };

  const blurUsers = apiFriendRequests.isPreviousData ? "blur" : "";

  const enableNextPageBtn =
    apiFriendRequests.data !== undefined
      ? page < apiFriendRequests.data.totalPages
      : false;

  const apiError =
    apiFriendRequests.isError || apiFriendRequests.data === undefined;
  const apiNoResults = apiFriendRequests.data?.data.length === 0;

  return (
    <>
      <NavBar userId={props.authSession.user.id} />
      <div className="flex-1 p-8 grid grid-cols-4">
        {apiError || apiNoResults ? (
          <ErrorOrNoResultsFound errorOcurred={apiError} />
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
      try {
        const friendRequestsResponse =
          await ReadStore.FriendRequest.GetMany.apiCall({
            filter: { a: { userId: authSession.user.id } },
            page: 1,
            pageSize,
          });
        return { props: { authSession, friendRequestsResponse } };
      } catch (error) {
        return { props: { authSession } };
      }
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};

type FriendRequestCardProps = {
  friendRequest: ReadStore.FriendRequest.FriendRequestModel;
  authSession: Session;
  router: NextRouter;
};

const FriendRequestFoundCard = (props: FriendRequestCardProps) => {
  const queryClient = useQueryClient();

  const apiCancelFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Cancel.Request) => {
      return EventStore.FriendRequest.Cancel.apiCall(
        request,
        props.authSession.access_token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ReadStore.queryKeys.friendRequest],
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

  //   props.friendRequest.profilePictureUrl == undefined
  //     ? AnonymousProfilePicture
  //     : props.friendRequest.;

  // const apiSendFriendRequest = useMutation({
  //   mutationFn: (request: EventStore.FriendRequest.Send.Request) => {
  //     return EventStore.FriendRequest.Send.apiCall(
  //       request,
  //       props.authSession.access_token
  //     );
  //   },
  // });
  const onSendFriendRequestClicked = () => () => {
    // apiSendFriendRequest.mutate({ toUserId: props.user.id });
  };

  const onCancelFriendRequestClicked = () => {
    apiCancelFriendRequest.mutate({ friendRequestId: props.friendRequest.id });
  };

  return (
    <div className="card card-compact bg-base-100 shadow-lg">
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
              onClick={onCancelFriendRequestClicked}
            >
              Cancel Friend Request
            </button>
          ) : (
            <div>
              <button className="btn btn-ghost text-primary">Accept</button>
              <button className="btn btn-ghost text-secondary">Reject</button>
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
