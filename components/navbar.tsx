import { ReadStore } from "@/external-apis";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
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
      ReadStore.User.FindOne.apiCall(
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

  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex pt-2 pl-2 pr-2 gap-2">
      <form className="flex-1 form-control" onSubmit={onSearchUserSubmit}>
        <div className="input-group">
          <input
            type="text"
            name="query"
            placeholder="Search name/alias"
            className="flex-1 input input-bordered"
            defaultValue={props.searchQuery}
          />
          <button className="btn">
            <FaSearch />
          </button>
        </div>
      </form>

      <div className="avatar">
        <div className="w-12 rounded-full">
          <Image
            alt="profile-pic"
            src={profilePicture}
            width={80}
            height={80}
          />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
