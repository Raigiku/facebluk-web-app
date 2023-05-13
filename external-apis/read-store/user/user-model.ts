export type UserModel = {
  id: string;
  alias: string;
  name: string;
  profilePictureUrl: string | null;
  relationshipWithUser: {
    isFriend: boolean;
    pendingFriendRequestId: string | null;
  } | null;
};
