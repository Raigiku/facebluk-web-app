import { Pagination } from "@/external-apis/common";
import { gql, request } from "graphql-request";
import { READ_STORE_API_URL } from "..";
import { PostModel } from "./post-model";

export type Params = {
  filter: {
    a?: { placeholder: true };
  };
  pagination: Pagination.Request;
};

export const apiCall = (
  params: Params,
  bearerToken: string
): Promise<Pagination.Response<PostModel>> => {
  return request(
    READ_STORE_API_URL,
    gql`
      query Posts($filter: PostsFilter!, $pagination: Pagination!) {
        posts(filter: $filter, pagination: $pagination) {
          hasMoreData
          data {
            id
            description
            user {
              id
              name
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
