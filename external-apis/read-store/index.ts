export * as FriendRequest from "./friend-request";
export * as User from "./user";

export const READ_STORE_API_URL =
  process.env.ENVIRONMENT === "local"
    ? "http://localhost:4000"
    : (() => {
        throw new Error("ENVIRONMENT var undefined");
      })();

export const queryKeys = {
  friendRequest: "friend-request",
  user: "user",
  searchUser: "search-user",
};
