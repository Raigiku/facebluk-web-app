import { ReadStore } from "@/external-apis";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaSearch } from "react-icons/fa";

type NavBarProps = {
  searchQuery?: string;
  userId: string;
  bearerToken: string;
};

const NavBar = (props: NavBarProps) => {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const apiUser = useQuery({
    queryKey: ReadStore.queryKeys.userById(props.userId),
    queryFn: () =>
      ReadStore.User.GetOne.apiCall(
        { filter: { a: { id: props.userId } } },
        props.bearerToken
      ),
  });

  const onSearchUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = e.currentTarget.query.value;
    if (query?.length > 0) router.push(`/search/${query}`);
  };

  const profilePicture =
    apiUser.data?.profilePictureUrl == null
      ? AnonymousProfilePicture
      : apiUser.data.profilePictureUrl;

  const onClickFriendRequests = async () => {
    router.push("/friend-requests");
  };

  const onClickFriends = async () => {
    router.push("/friends");
  };

  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex items-center mt-4">
      <div className="flex flex-1 justify-center">
        <Link href="/">Home</Link>
      </div>

      <form
        className="form-control"
        style={{ flex: "2" }}
        onSubmit={onSearchUserSubmit}
      >
        <div className="input-group">
          <input
            type="text"
            name="query"
            placeholder="Search someone by name or alias"
            className="flex-1 input input-bordered"
            defaultValue={props.searchQuery}
          />
          <button className="btn">
            <FaSearch />
          </button>
        </div>
      </form>

      <div className="flex-1 flex justify-end">
        <div className="dropdown dropdown-hover dropdown-left mr-4">
          <div className="avatar">
            <div className="w-12 rounded-full" tabIndex={0}>
              <Image
                alt="profile-pic"
                src={profilePicture}
                width={80}
                height={80}
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu shadow bg-base-100 rounded-box w-52"
          >
            <li onClick={onClickFriendRequests}>
              <a>Friend Requests</a>
            </li>
            <li onClick={onClickFriends}>
              <a>Friends</a>
            </li>
            <li onClick={onClickLogout}>
              <div className="text-secondary">Sign Out</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
