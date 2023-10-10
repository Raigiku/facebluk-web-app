import axios from "axios";
import { COMMAND_API_URL } from "..";

export type Request = {
  friendRequestId: string
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/cancel-friend-request/v1", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: COMMAND_API_URL,
    })
    .then((res) => res.data);
};
