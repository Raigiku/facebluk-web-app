import axios from "axios";
import { COMMAND_API_URL } from "..";

export type Request = {
  description: string;
  taggedUserIds: string[]
};

export type Response = {
  postId: string;
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/create-post/v1", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: COMMAND_API_URL,
    })
    .then((res) => res.data as Response);
};
