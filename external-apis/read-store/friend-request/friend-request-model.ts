export type FriendRequestModel = {
  id: string;
  fromUser: FriendRequestModel_U;
  toUser: FriendRequestModel_U;
  status: "pending" | "accepted" | "cancelled" | "rejected";
  createdAt: Date;
};

export type FriendRequestModel_U = {
  id: string;
  name: string;
  alias: string;
  profilePictureUrl: string | null;
};
