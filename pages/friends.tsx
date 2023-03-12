import NavBar from "@/components/navbar";
import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";

const FriendsPage: NextPageWithLayout = () => {
  return (
    <div className="flex-1">
      <div>da</div>
      <div>da</div>
      <div>da</div>
      <div>da</div>
      <div>12312</div>
    </div>
  );
};

export default FriendsPage;

FriendsPage.getLayout = (page: ReactElement) => {
  return (
    <>
      <NavBar />
      {page}
    </>
  );
};
