import { Pagination } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { FriendRequestModel } from ".";
import { READ_STORE_API_URL } from "..";

export type Params = {
  filter: {
    a?: { placeholder: true };
  };
  pagination: Pagination.Request;
};

export const apiCall = (
  params: Params,
  bearerToken: string
): Promise<Pagination.Response<FriendRequestModel>> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query FriendRequests(
        $filter: FriendRequestsFilter!
        $pagination: Pagination!
      ) {
        friendRequests(filter: $filter, pagination: $pagination) {
          nextPage
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
    params,
    { authorization: `Bearer ${bearerToken}` }
  ).then((res: any) => res.friendRequests);
};
