import { gql } from "@apollo/client";
import { User, graphqlClient } from "..";

export type Params = {
  readonly alias: string;
};

export const apiCall = (
  params: Params
): Promise<User.UserModel | null> => {
  return graphqlClient
    .query({
      query: gql`
        query UserByAlias($alias: String!) {
          userByAlias(alias: $alias) {
            alias
            id
            name
            profilePictureUrl
          }
        }
      `,
      variables: params,
    })
    .then((res) => res.data.userByAlias);
};
