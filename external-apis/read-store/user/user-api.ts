import { gql, request } from "graphql-request";
import { UserModel } from ".";
import { QUERY_API_URL } from "..";

export type Params = {
  filter: {
    a?: { id: string };
    b?: { alias: string };
  };
};

export const apiCall = (
  params: Params,
  bearerToken: string
): Promise<UserModel | null> => {
  return request(
    QUERY_API_URL,
    gql`
      query User($filter: UserFilter!) {
        user(filter: $filter) {
          id
          name
          alias
          profilePictureUrl
          relationshipWithUser {
            isFriend
            pendingFriendRequest {
              id
              isRequestUserReceiver
            }
          }
        }
      }
    `,
    params,
    { authorization: `Bearer ${bearerToken}` }
  ).then((res: any) => res.user);
};
