import { UserModel } from "../user";

export type FriendRequestModel = {
  id: string;
  fromUser: UserModel;
  toUser: UserModel;
  status: "pending" | "accepted" | "cancelled" | "rejected";
  createdAt: Date;
};
