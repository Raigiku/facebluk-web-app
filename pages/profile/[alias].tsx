import NavBar from "@/components/navbar";
import { ReadStore } from "@/external-apis";
import SadFaceImg from "@/public/sad-face.png";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-react";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "../_app";

type ProfilePageProps = {
  authSession: Session;
};

const ProfilePage: NextPageWithLayout<ProfilePageProps> = (
  props: ProfilePageProps
) => {
  const router = useRouter();
  const userAlias = router.query.alias as string;

  const apiUser = useQuery({
    queryKey: ReadStore.queryKeys.userByAlias(userAlias),
    queryFn: () =>
      ReadStore.User.GetOne.apiCall({
        filter: { b: { alias: userAlias } },
      }),
  });

  const profilePicture =
    apiUser.data?.profilePictureUrl ?? AnonymousProfilePicture;

  return (
    <>
      <NavBar userId={props.authSession.user.id} />
      <div className="flex-1 flex">
        {apiUser.data == null ? (
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
                  alt={apiUser.data.alias}
                  src={profilePicture}
                  width={80}
                  height={80}
                />
              </div>
            </div>
            <div>
              <div className="text-base font-medium">{apiUser.data.name}</div>
              <div className="italic">@{apiUser.data.alias}</div>
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
      const queryClient = new QueryClient();
      const aliasQuery = ctx.query.alias as string;
      await queryClient.prefetchQuery(ReadStore.queryKeys.userByAlias(aliasQuery), () =>
        ReadStore.User.GetOne.apiCall({
          filter: { b: { alias: aliasQuery } },
        })
      );
      return {
        props: { authSession, dehydratedState: dehydrate(queryClient) },
      };
    }
  }
  return { redirect: { destination: "/", permanent: true } };
};
