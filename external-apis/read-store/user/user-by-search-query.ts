import { PaginationResponse } from "@/external-apis/common";
import { gql } from "@apollo/client";
import { User, graphqlClient } from "..";

export type Params = {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
};

export const apiCall = (
  params: Params
): Promise<PaginationResponse<User.UserModel>> => {
  return graphqlClient
    .query({
      query: gql`
        query UsersBySearchQuery(
          $searchQuery: String!
          $page: Int!
          $pageSize: Int!
        ) {
          usersBySearchQuery(
            searchQuery: $searchQuery
            page: $page
            pageSize: $pageSize
          ) {
            totalPages
            data {
              alias
              id
              name
              profilePictureUrl
            }
          }
        }
      `,
      variables: params,
    })
    .then((res) => res.data.usersBySearchQuery);
};
