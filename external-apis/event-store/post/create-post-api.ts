import axios from "axios";
import { EVENT_STORE_API_URL } from "..";

export type Request = {
  description: string;
};

export type Response = {
  postId: string;
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/api/posts/create", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: EVENT_STORE_API_URL,
    })
    .then((res) => res.data as Response);
};
