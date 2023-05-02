import { UserModel } from "../user";

export type FriendRequestModel = {
  readonly id: string;
  readonly fromUser: UserModel;
  readonly toUser: UserModel;
  readonly status: "pending" | "accepted" | "cancelled" | "rejected";
  readonly createdAt: Date;
};
