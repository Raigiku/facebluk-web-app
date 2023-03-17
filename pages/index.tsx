import NavBar from "@/components/navbar";
import {
  createServerSupabaseClient,
  Session
} from "@supabase/auth-helpers-nextjs";
import {
  SupabaseClient,
  useSupabaseClient
} from "@supabase/auth-helpers-react";
import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import { GetServerSideProps } from "next";

type HomeProps = {
  session: Session | null;
};

const HomePage = (props: HomeProps) => {
  const supabase = useSupabaseClient();

  const HomeContent =
    props.session === null ? (
      <HomeNotLoggedInContent supabase={supabase} />
    ) : (
      <HomeLoggedInContent session={props.session} />
    );

  return HomeContent;
};

export default HomePage;

type HomeNotLoggedInContentProps = {
  supabase: SupabaseClient;
};

const HomeNotLoggedInContent = (props: HomeNotLoggedInContentProps) => {
  props.supabase.auth.signInWithOAuth({provider:'google',options:{}})
  return (
    <div className="flex flex-1 self-center">
      <div className="flex flex-1 gap-12">
        <div className="flex flex-col flex-1 justify-center gap-2">
          <h1 className="text-5xl font-bold text-primary">facebluk</h1>
          <p className="text-lg">
            Connect with friends and the world around you on Facebook.
          </p>
        </div>
        <div className="flex flex-col flex-1 justify-center">
          <Auth
            supabaseClient={props.supabase}
            onlyThirdPartyProviders={true}
            appearance={{
              theme: ThemeSupa,
              style: { button: { fontFamily: "system-ui" } },
            }}
            providers={["google"]}
          />
          <p className="self-center">
            <span className="font-medium">Create a Page</span> for a celebrity,
            brand or business.
          </p>
        </div>
      </div>
    </div>
  );
};

type HomeLoggedInContentProps = {
  session: Session;
};

const HomeLoggedInContent = (props: HomeLoggedInContentProps) => {
  return (
    <>
      <NavBar />
      <div className="flex-1">{props.session.access_token}</div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  ctx
) => {
  const supabase = createServerSupabaseClient(ctx);
  const sessionResponse = await supabase.auth.getSession();
  return { props: { session: sessionResponse.data.session } };
};
