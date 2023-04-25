import { gql } from "@apollo/client";
import { User, graphqlClient } from "..";

export type Params = {
  readonly id: string;
};

export const apiCall = (params: Params): Promise<User.UserModel | null> => {
  return graphqlClient
    .query({
      query: gql`
        query UserById($id: ID!) {
          userById(id: $id) {
            id
            name
            alias
            profilePictureUrl
          }
        }
      `,
      variables: params,
    })
    .then((res) => res.data.userById);
};
