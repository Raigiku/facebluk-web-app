import { PaginationResponse } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { UserModel } from ".";
import { READ_STORE_API_URL } from "..";

export type Params = {
  filter: {
    a?: { searchQuery: string };
  };
  pagination: {
    page: number;
    pageSize: number;
  };
};

export const apiCall = (
  params: Params,
  bearerToken: string
): Promise<PaginationResponse<UserModel>> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query Users($filter: UsersFilter!, $pagination: Pagination!) {
        users(filter: $filter, pagination: $pagination) {
          totalPages
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
