export type PostModel = {
  id: string;
  description: string;
  user: {
    id: string;
    name: string;
    alias: string;
    profilePictureUrl: string | null;
  };
};
