import { Pagination } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { QUERY_API_URL } from "..";
import { PostModel } from "./post-model";

export type Params = {
  filter: {
    a?: { placeholder: true };
    b?: { userId: string };
  };
  pagination: Pagination.Request;
};

export const apiCall = (
  params: Params,
  bearerToken: string
): Promise<Pagination.Response<PostModel>> => {
  return request(
    QUERY_API_URL,
    gql`
      query Posts($filter: PostsFilter!, $pagination: Pagination!) {
        posts(filter: $filter, pagination: $pagination) {
          nextPage
          data {
            id
            description
            user {
              id
              name
              alias
              profilePictureUrl
            }
          }
        }
      }
    `,
    params,
    { authorization: `Bearer ${bearerToken}` }
  ).then((res: any) => res.posts);
};
