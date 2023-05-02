import NavBar from "@/components/navbar";
import { ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { NextPageWithLayout } from "../_app";

type ProfilePageProps = {
  authSession: Session;
  user: ReadStore.User.UserModel | null;
};

const ProfilePage: NextPageWithLayout<ProfilePageProps> = (
  props: ProfilePageProps
) => {
  const profilePicture =
    props.user?.profilePictureUrl ?? AnonymousProfilePicture;

  return (
    <>
      <NavBar userId={props.authSession.user.id} />
      <div className="flex-1 flex">
        {props.user === null ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2">
            <Image
              alt="no-user-found"
              src={SadFaceImg}
              width={80}
              height={80}
            />
            <div>No user found</div>
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center gap-4">
            <div className="avatar">
              <div className="w-40 rounded-full">
                <Image
                  alt={props.user.alias}
                  src={profilePicture}
                  width={80}
                  height={80}
                />
              </div>
            </div>
            <div>
              <div className="text-base font-medium">{props.user.name}</div>
              <div className="italic">@{props.user.alias}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;

export const getServerSideProps: GetServerSideProps<ProfilePageProps> = async (
  ctx
) => {
  const supabase = createServerSupabaseClient(ctx);
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
      try {
        const aliasQuery = ctx.query.alias as string;
        const userResponse = await ReadStore.User.GetOne.apiCall({
          filter: { b: { alias: aliasQuery } },
        });
        return { props: { authSession, user: userResponse } };
      } catch (error) {
        return { props: { authSession, user: null } };
      }
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};
