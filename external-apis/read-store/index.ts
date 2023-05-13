export * as FriendRequest from "./friend-request";
export * as User from "./user";

export const READ_STORE_API_URL =
  process.env.ENVIRONMENT === "local"
    ? "http://localhost:4000"
    : (() => {
        throw new Error("ENVIRONMENT var undefined");
      })();

export const queryKeys = {
  usersKey: "users" as const,
  userById: (userId: string) => [queryKeys.usersKey, userId] as const,
  userByAlias: (alias: string) => [queryKeys.usersKey, alias] as const,
  usersBySearchQuery: (searchQuery: string, page: number) =>
    [queryKeys.usersKey, searchQuery, page] as const,

  friendRequestsKey: "friend-requests" as const,
  myFriendRequestsPage: (page: number) =>
    [queryKeys.friendRequestsKey, page] as const,
};
