export type UserModel = {
  readonly id: string;
  readonly alias: string;
  readonly name: string;
  readonly profilePictureUrl: string | null;
  readonly relationshipWithUser: {
    readonly isBlocked: boolean;
    readonly isFriend: boolean;
  } | null;
};
