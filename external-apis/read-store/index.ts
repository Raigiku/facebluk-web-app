export * as FriendRequest from "./friend-request";
export * as Post from "./post";
export * as User from "./user";

export const QUERY_API_URL = process.env.NEXT_PUBLIC_QUERY_API_URL!;

export const queryKeys = {
  usersKey: "users" as const,
  userById: (userId: string) => [queryKeys.usersKey, userId] as const,
  userByAlias: (alias: string) => [queryKeys.usersKey, alias] as const,
  usersBySearchQuery: (searchQuery: string) =>
    [queryKeys.usersKey, "search", searchQuery] as const,

  friendRequestsKey: "friend-requests" as const,
  myFriendRequests: () => [queryKeys.friendRequestsKey, "me"] as const,

  friendsKey: "friends" as const,
  myFriends: () => [queryKeys.friendsKey, "me"] as const,

  postsKey: "posts" as const,
  homePosts: () => [queryKeys.postsKey, "home"] as const,
  userPosts: (userId: string) => [queryKeys.postsKey, "user", userId] as const,
};
