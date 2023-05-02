import { PaginationResponse } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { FriendRequestModel } from ".";
import { READ_STORE_API_URL } from "..";

export type Params = {
  readonly filter: {
    readonly a?: { readonly userId: string };
  };
  readonly page: number;
  readonly pageSize: number;
};

export const apiCall = (
  params: Params
): Promise<PaginationResponse<FriendRequestModel>> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query FriendRequests(
        $filter: FriendRequestsFilter!
        $page: Int!
        $pageSize: Int!
      ) {
        friendRequests(filter: $filter, page: $page, pageSize: $pageSize) {
          totalPages
          data {
            id
            fromUser {
              id
              name
              alias
              profilePictureUrl
            }
            toUser {
              id
              name
              alias
              profilePictureUrl
            }
            status
            createdAt
          }
        }
      }
    `,
    params
  ).then((res: any) => res.friendRequests);
};
