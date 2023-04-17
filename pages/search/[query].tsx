import NavBar from "@/components/navbar";
import { PaginationResponse, ReadStore } from "@/external-apis";
import { User } from "@/external-apis/read-store";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { useQuery } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { NextPageWithLayout } from "../_app";

type SearchPageProps = {
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
    queryKey: ["search", searchQuery, page],
    queryFn: () => ReadStore.User.Search.apiCall(searchQuery, page, pageSize),
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
    <div className="flex-1 p-8 grid grid-cols-4">
      {props.searchResponse === undefined ? (
        <div className="col-start-2 col-end-4 flex flex-col items-center justify-center gap-4">
          <Image alt="network-error" src={SadFaceImg} width={80} height={80} />
          <div>An unexpected error ocurred. Try again later</div>
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
            <div className={`flex flex-col justify-center gap-4 ${blurUsers}`}>
              {apiSearchQuery.isSuccess && (
                <>
                  {apiSearchQuery.data?.data.map((user) => (
                    <UserFoundCard key={user.id} user={user} />
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
  );
};

export default SearchPage;

SearchPage.getLayout = (page: ReactElement) => {
  const router = useRouter();
  return (
    <>
      <NavBar searchQuery={router.query.query as string} />
      {page}
    </>
  );
};

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (
  ctx
) => {
  try {
    const searchQuery = ctx.query.query as string;
    const response = await ReadStore.User.Search.apiCall(
      searchQuery,
      1,
      pageSize
    );
    return { props: { searchResponse: response } };
  } catch (error) {
    return { props: {} };
  }
};

type UserFoundCardProps = {
  user: ReadStore.User.UserModel;
};

const UserFoundCard = (props: UserFoundCardProps) => {
  const profilePicture =
    props.user.profilePictureUrl == undefined
      ? AnonymousProfilePicture
      : props.user.profilePictureUrl;

  return (
    <div className="card card-compact bg-base-100 shadow-lg">
      <div className="card-body flex flex-row gap-6 items-center">
        <Image
          alt={props.user.alias}
          src={profilePicture}
          width={80}
          height={80}
        />
        <div className="flex flex-col">
          <div className="text-base font-medium">{props.user.name}</div>
          <div className="italic">{props.user.alias}</div>
        </div>
        <div className="flex-1 flex justify-end">
          <button className="btn btn-ghost">Send Friend Request</button>
        </div>
      </div>
    </div>
  );
};
