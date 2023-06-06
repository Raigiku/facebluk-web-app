import { useRouter } from "next/router";
import { AiOutlineHome, AiOutlineMenu, AiOutlineUser } from "react-icons/ai";
import { HiOutlineUsers } from "react-icons/hi";

type BottomNavProps = {
  activeTab?: "friends" | "home" | "settings" | "profile";
};

const BottomNav = (props: BottomNavProps) => {
  const router = useRouter();

  return (
    <div className="btm-nav">
      <button
        className={props.activeTab === "home" ? "active" : ""}
        onClick={() => {
          router.push("/home");
        }}
      >
        <AiOutlineHome />
        <span className="text-xs">Home</span>
      </button>

      <button
        className={props.activeTab === "friends" ? "active" : ""}
        onClick={() => {
          router.push("/friends");
        }}
      >
        <HiOutlineUsers />
        <span className="text-xs">Friends</span>
      </button>

      <button
        className={props.activeTab === "profile" ? "active" : ""}
        onClick={() => {
          // router.push("/friends");
        }}
      >
        <AiOutlineUser />
        <span className="text-xs">Profile</span>
      </button>

      <button
        className={props.activeTab === "settings" ? "active" : ""}
        onClick={() => {
          router.push("/settings");
        }}
      >
        <AiOutlineMenu />
        <span className="text-xs">Menu</span>
      </button>
    </div>
  );
};

export default BottomNav;
