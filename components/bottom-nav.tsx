import { ReadStore } from "@/external-apis";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { AiOutlineHome, AiOutlineMenu, AiOutlineUser } from "react-icons/ai";
import { HiOutlineUsers } from "react-icons/hi";

type BottomNavProps = {
  activeTab?: "friends" | "home" | "menu" | "profile";
  authSession: Session;
};

const BottomNav = (props: BottomNavProps) => {
  const router = useRouter();

  const apiUser = useQuery({
    queryKey: ReadStore.queryKeys.userById(props.authSession.user.id),
    queryFn: () =>
      ReadStore.User.FindOne.apiCall(
        { filter: { a: { id: props.authSession.user.id } } },
        props.authSession.access_token
      ),
  });

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
          if (apiUser.data != null)
            router.push(`/profile/${apiUser.data.alias}`);
        }}
      >
        <AiOutlineUser />
        <span className="text-xs">Profile</span>
      </button>

      <button
        className={props.activeTab === "menu" ? "active" : ""}
        onClick={() => {
          router.push("/menu");
        }}
      >
        <AiOutlineMenu />
        <span className="text-xs">Menu</span>
      </button>
    </div>
  );
};

export default BottomNav;
