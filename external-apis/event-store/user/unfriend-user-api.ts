import axios from "axios";
import { EVENT_STORE_API_URL } from "..";

export type Request = {
  toUserId: string;
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/users/unfriend", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: EVENT_STORE_API_URL,
    })
    .then((res) => res.data);
};
