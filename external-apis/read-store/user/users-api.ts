import { Pagination } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { UserModel } from ".";
import { READ_STORE_API_URL } from "..";

export type Params = {
  filter: {
    a?: { searchQuery: string };
    b?: { placeholder: boolean };
  };
  pagination: Pagination.Request;
};

export const apiCall = (
  params: Params,
  bearerToken: string
): Promise<Pagination.Response<UserModel>> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query Users($filter: UsersFilter!, $pagination: Pagination!) {
        users(filter: $filter, pagination: $pagination) {
          hasMoreData
          data {
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
      }
    `,
    params,
    { authorization: `Bearer ${bearerToken}` }
  ).then((res: any) => res.users);
};
