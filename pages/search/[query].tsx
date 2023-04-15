import NavBar from "@/components/navbar";
import { ReadStore } from "@/external-apis";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { NextPageWithLayout } from "../_app";

type SearchPageProps = {
  searchResponse: ReadStore.User.Search.Pagination;
};

const SearchPage: NextPageWithLayout<SearchPageProps> = (
  props: SearchPageProps
) => {
  const router = useRouter();
  const searchQuery = router.query.query as string;

  const [page, setPage] = useState(1);

  // const apiSearchQuery = useQuery({
  //   queryKey: ["todos", searchQuery, page],
  //   queryFn: () => ReadStore.User.Search.apiCall(searchQuery, page, 5),
  //   initialData: props.searchResponse,
  // });

  const nextPageClicked = async () => {
    setPage((prev) => prev + 1);
    // const response = await ReadStore.User.Search.apiCall(searchQuery, page, 5);
    // return { props: { users: response.data.users } };
  };

  const prevPageClicked = () => {
    setPage((prev) => prev - 1);
  };

  return (
    <div className="flex-1 p-8 grid grid-cols-4">
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
      <div className="col-start-2 col-end-4 flex flex-col gap-4">
        {props.searchResponse.users.map((user) => (
          <UserFoundCard key={user.id} user={user} />
        ))}
      </div>
      <div className="flex items-center pl-8">
        <button
          className="btn btn-circle btn-outline"
          onClick={nextPageClicked}
        >
          <BsChevronRight />
        </button>
      </div>
    </div>
  );
};

export default SearchPage;

SearchPage.getLayout = (page: ReactElement) => {
  return (
    <>
      <NavBar />
      {page}
    </>
  );
};

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (
  ctx
) => {
  const { query } = ctx.query;
  if (typeof query === "string") {
    const response = await ReadStore.User.Search.apiCall(query, 1, 5);
    return { props: { searchResponse: response.data } };
  }
  return { props: { searchResponse: { users: [] } } };
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
