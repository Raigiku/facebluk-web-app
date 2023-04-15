import { gql } from "@apollo/client";
import { graphqlClient } from "..";
import { UserModel } from "./user-model";

export type Args = {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
};

export const apiCall = (
  searchQuery: string,
  page: number,
  pageSize: number
) => {
  return graphqlClient
    .query<Pagination>({
      query: gql`
        query Users($searchQuery: String!, $page: Int!, $pageSize: Int!) {
          users(searchQuery: $searchQuery, page: $page, pageSize: $pageSize) {
            id
            alias
            name
            profilePictureUrl
          }
        }
      `,
      variables: { searchQuery, page, pageSize },
    })
    .then((res) => res.data);
};

export type Pagination = {
  users: UserModel[];
};
