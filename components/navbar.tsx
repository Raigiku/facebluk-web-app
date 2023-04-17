import Link from "next/link";
import { useRouter } from "next/router";
import { FaSearch } from "react-icons/fa";

type NavBarProps = {
  searchQuery?: string;
};

const NavBar = (props: NavBarProps) => {
  const router = useRouter();

  const onSearchUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = e.currentTarget.query.value;
    router.push(`/search/${query}`);
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

      <div className="flex flex-1 justify-center">
        <Link href="/friends">Friends</Link>
      </div>
    </div>
  );
};

export default NavBar;
