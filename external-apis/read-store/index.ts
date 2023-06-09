export * as FriendRequest from "./friend-request";
export * as Post from "./post";
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
  usersBySearchQuery: (searchQuery: string) =>
    [queryKeys.usersKey, "search", searchQuery] as const,

  friendRequestsKey: "friend-requests" as const,
  myFriendRequestsPage: (page: number) =>
    [queryKeys.friendRequestsKey, page] as const,

  friendsKey: "friends" as const,
  myFriends: () => [queryKeys.friendsKey, "me"] as const,

  postsKey: "posts" as const,
  homePosts: () => [queryKeys.postsKey, "home"] as const,
  userPosts: (userId: string) => [queryKeys.postsKey, "user", userId] as const,
};
