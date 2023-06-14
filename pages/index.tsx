import { Supabase } from "@/external-apis";
import { createClientComponentClient, createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

const HomePage = () => {
  const supabase = createClientComponentClient();
  const authSession = useSession();
  const router = useRouter();

  useEffect(() => {
    if (authSession !== null) router.push("/home");
  }, [authSession, router]);

  return (
    <div className="flex-1 flex flex-col justify-center p-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-bold text-primary">facebluk</h1>
        <div className="text-lg">
          Connect with friends and the world around you!
        </div>
        <Auth
          supabaseClient={supabase}
          onlyThirdPartyProviders={true}
          appearance={{
            theme: ThemeSupa,
            style: { button: { fontFamily: "system-ui" } },
          }}
          providers={["google"]}
          redirectTo={Supabase.REDIRECT_TO_URL}
        />
      </div>
    </div>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  const sessionResponse = await supabase.auth.getSession();
  if (sessionResponse.data.session !== null)
    return { redirect: { destination: "/home", permanent: false } };
  return { props: {} };
};
