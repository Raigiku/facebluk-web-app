export type UserModel = {
  id: string;
  name: string;
  alias: string;
  profilePictureUrl: string | null;
  relationshipWithUser: {
    isFriend: boolean;
    pendingFriendRequest: {
      id: string;
      isRequestUserReceiver: boolean;
    } | null;
  };
};
