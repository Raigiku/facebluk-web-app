import { gql, request } from "graphql-request";
import { UserModel } from ".";
import { READ_STORE_API_URL } from "..";

export type Params = {
  readonly filter: {
    readonly a?: { readonly id: string };
    readonly b?: { readonly alias: string };
  };
};

export const apiCall = (params: Params): Promise<UserModel | null> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query User($filter: UserFilter!) {
        user(filter: $filter) {
          id
          name
          alias
          profilePictureUrl
        }
      }
    `,
    params
    ).then((res: any) => res.user);
};
