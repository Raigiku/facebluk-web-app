import BottomNav from "@/components/bottom-nav";
import ContentContainer from "@/components/content-container";
import NavBar from "@/components/navbar";
import { Session, createClientComponentClient, createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

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
          <button onClick={onClickLogout} className="btn btn-error text-white p-4">
            Log out
          </button>
        </div>
      </ContentContainer>

      <BottomNav authSession={props.authSession} activeTab="menu" />
    </>
  );
};

export default MenuPage;

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
