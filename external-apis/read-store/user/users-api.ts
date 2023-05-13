import { PaginationResponse } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { UserModel } from ".";
import { READ_STORE_API_URL } from "..";

export type Params = {
  filter: {
    a?: { searchQuery: string; userId: string };
  };
  page: number;
  pageSize: number;
};

export const apiCall = (
  params: Params
): Promise<PaginationResponse<UserModel>> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query Users($filter: UsersFilter!, $page: Int!, $pageSize: Int!) {
        users(filter: $filter, page: $page, pageSize: $pageSize) {
          totalPages
          data {
            id
            name
            alias
            profilePictureUrl
            relationshipWithUser {
              isFriend
              pendingFriendRequestId
            }
          }
        }
      }
    `,
    params
  ).then((res: any) => res.users);
};
