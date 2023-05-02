import NavBar from "@/components/navbar";
import { EventStore, PaginationResponse, ReadStore } from "@/external-apis";
import { User } from "@/external-apis/read-store";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { NextRouter, useRouter } from "next/router";
import { useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { NextPageWithLayout } from "../_app";

type SearchPageProps = {
  authSession: Session;
  searchResponse?: PaginationResponse<User.UserModel>;
};

const pageSize = 5;

const SearchPage: NextPageWithLayout<SearchPageProps> = (
  props: SearchPageProps
) => {
  const router = useRouter();
  const searchQuery = router.query.query as string;

  const [page, setPage] = useState(1);

  const apiSearchQuery = useQuery({
    queryKey: [ReadStore.queryKeys.searchUser, searchQuery, page],
    queryFn: () =>
      ReadStore.User.GetMany.apiCall({
        filter: { a: { searchQuery } },
        page,
        pageSize,
      }),
    initialData: page === 1 ? props.searchResponse : undefined,
    enabled: props.searchResponse !== undefined,
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
    apiSearchQuery.data !== undefined
      ? page < apiSearchQuery.data.totalPages
      : false;

  return (
    <>
      <NavBar
        searchQuery={router.query.query as string}
        userId={props.authSession.user.id}
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
      try {
        const searchQuery = ctx.query.query as string;
        const searchResponse = await ReadStore.User.GetMany.apiCall({
          filter: { a: { searchQuery } },
          page: 1,
          pageSize,
        });
        return { props: { searchResponse, authSession } };
      } catch (error) {
        return { props: { authSession } };
      }
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};

type UserFoundCardProps = {
  user: ReadStore.User.UserModel;
  authSession: Session;
  router: NextRouter;
};

const UserFoundCard = (props: UserFoundCardProps) => {
  const profilePicture =
    props.user.profilePictureUrl == undefined
      ? AnonymousProfilePicture
      : props.user.profilePictureUrl;

  const queryClient = useQueryClient();

  const apiSendFriendRequest = useMutation({
    mutationFn: (request: EventStore.FriendRequest.Send.Request) => {
      return EventStore.FriendRequest.Send.apiCall(
        request,
        props.authSession.access_token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ReadStore.queryKeys.friendRequest] });
    },
  });

  const isFoundUserLoggedUser = props.user.id === props.authSession.user.id;

  const onViewProfileClicked = () => {
    props.router.push(`/profile/${props.user.alias}`);
  };

  const onSendFriendRequestClicked = () => {
    apiSendFriendRequest.mutate({ toUserId: props.user.id });
  };

  return (
    <div className="card card-compact bg-base-100 shadow-lg">
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
        <div className="flex-1 flex justify-end">
          <button
            className="btn btn-ghost"
            onClick={
              isFoundUserLoggedUser
                ? onViewProfileClicked
                : onSendFriendRequestClicked
            }
          >
            {isFoundUserLoggedUser ? "View Profile" : "Add Friend"}
          </button>
        </div>
      </div>
    </div>
  );
};
