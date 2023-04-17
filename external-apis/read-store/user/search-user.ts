import { PaginationResponse } from "@/external-apis/common";
import { gql } from "@apollo/client";
import { User, graphqlClient } from "..";

export type Args = {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
};

export const apiCall = (
  searchQuery: string,
  page: number,
  pageSize: number
): Promise<PaginationResponse<User.UserModel>> => {
  return graphqlClient
    .query({
      query: gql`
        query Users($searchQuery: String!, $page: Int!, $pageSize: Int!) {
          users(searchQuery: $searchQuery, page: $page, pageSize: $pageSize) {
            totalPages
            data {
              id
              alias
              name
              profilePictureUrl
            }
          }
        }
      `,
      variables: { searchQuery, page, pageSize },
    })
    .then((res) => res.data.users);
};
