import NavBar from "@/components/navbar";
import { EventStore, PaginationResponse, ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import WindImg from "@/public/wind.png";
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
import { NextPageWithLayout } from "./_app";

type FriendsPageProps = {
  authSession: Session;
};

const pageSize = 5;

const FriendsPage: NextPageWithLayout<FriendsPageProps> = (
  props: FriendsPageProps
) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const apiFriends = useQuery({
    queryKey: ReadStore.queryKeys.myFriends(page),
    queryFn: () =>
      ReadStore.User.GetMany.apiCall(
        {
          filter: { b: { placeholder: true } },
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

  const blurUsers = apiFriends.isPreviousData ? "blur" : "";

  const enableNextPageBtn =
    apiFriends.data !== undefined ? page < apiFriends.data.totalPages : false;

  const apiErrorOrNoResults =
    apiFriends.isError || apiFriends.data?.data.length === 0;

  return (
    <>
      <NavBar
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />
      <div className="flex-1 p-8 grid grid-cols-4">
        {apiErrorOrNoResults ? (
          <ErrorOrNoResultsFound errorOcurred={apiFriends.isError} />
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
                {apiFriends.data?.data.map((x) => (
                  <FriendFoundCard
                    key={x.id}
                    authSession={props.authSession}
                    router={router}
                    friend={x}
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
      await queryClient.prefetchQuery(ReadStore.queryKeys.myFriends(1), () =>
        ReadStore.User.GetMany.apiCall(
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

type FriendCardProps = {
  friend: ReadStore.User.UserModel;
  authSession: Session;
  router: NextRouter;
  page: number;
};

const FriendFoundCard = (props: FriendCardProps) => {
  const queryClient = useQueryClient();

  const apiUnfriend = useMutation({
    mutationFn: (request: EventStore.User.Unfriend.Request) =>
      EventStore.User.Unfriend.apiCall(request, props.authSession.access_token),
    onSuccess: (_, request) => {
      queryClient.setQueryData<PaginationResponse<ReadStore.User.UserModel>>(
        ReadStore.queryKeys.myFriends(props.page),
        (old) => {
          if (old === undefined) return old;
          return produce(old, (draft) => {
            const idx = draft.data.findIndex((x) => x.id === request.toUserId);
            if (idx !== -1) draft.data.splice(idx, 1);
          });
        }
      );
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
      className="card card-compact bg-base-100 shadow-lg hover:bg-base-200 transition-colors cursor-pointer"
      onClick={onUserCardClicked}
    >
      <div className="card-body flex flex-row gap-4 items-center">
        <div className="avatar">
          <div className="w-20 rounded-full">
            <Image
              alt={props.friend.id}
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
        <div className="flex-1 flex justify-end">
          <button
            className={`btn btn-ghost text-secondary ${
              apiUnfriend.isLoading ? "loading" : ""
            }`}
            onClick={onUnfriendBtnClicked}
          >
            Unfriend
          </button>
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
          : "No friends found"}
      </div>
    </div>
  );
};
