import BottomNav from "@/components/bottom-nav";
import ContentContainer from "@/components/content-container";
import NavBar from "@/components/navbar";
import { Session, createClientComponentClient, createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import tw from "tailwind-styled-components";

type MenuPageProps = {
  authSession: Session;
};

const MenuPage = (props: MenuPageProps) => {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const onClickLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      <NavBar
        userId={props.authSession.user.id}
        bearerToken={props.authSession.access_token}
      />

      <ContentContainer>
        <div className="card shadow-md rounded-[16px] overflow-hidden">
          <MenuItem onClick={onClickLogout} className="text-secondary">
            Log out
          </MenuItem>
        </div>
      </ContentContainer>

      <BottomNav authSession={props.authSession} activeTab="menu" />
    </>
  );
};

export default MenuPage;

const MenuItem = tw.button`
  hover:bg-gray-200
  p-4
  transition-colors
`;

export const getServerSideProps: GetServerSideProps<MenuPageProps> = async (
  ctx
) => {
  const supabase = createPagesServerClient (ctx);
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
      return {
        props: { authSession },
      };
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};
