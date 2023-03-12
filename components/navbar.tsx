import Link from "next/link";

const NavBar = () => {
  return (
    <div className="flex justify-evenly">
      <Link href="/">Home</Link>
      <Link href="/friends">Friends</Link>
    </div>
  );
};

export default NavBar;
