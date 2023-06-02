export * from "./errors";
export * as FriendRequest from './friend-request';
export * as Post from './post';
export * as User from "./user";

export const EVENT_STORE_API_URL =
  process.env.ENVIRONMENT === "local"
    ? "http://localhost:3000"
    : (() => {
        throw new Error("ENVIRONMENT var undefined");
      })();
