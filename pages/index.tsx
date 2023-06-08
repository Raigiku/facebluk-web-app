import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

const HomePage = () => {
  const supabase = useSupabaseClient();
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
      </div>
      <div className="flex flex-col">
        <Auth
          supabaseClient={supabase}
          onlyThirdPartyProviders={true}
          appearance={{
            theme: ThemeSupa,
            style: { button: { fontFamily: "system-ui" } },
          }}
          providers={["google"]}
        />
        <div className="self-center">
          <span className="font-medium">Create a Page</span> for a celebrity,
          brand or business.
        </div>
      </div>
    </div>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);
  const sessionResponse = await supabase.auth.getSession();
  if (sessionResponse.data.session !== null)
    return { redirect: { destination: "/home", permanent: false } };
  return { props: {} };
};
