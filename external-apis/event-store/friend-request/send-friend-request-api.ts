import axios from "axios";
import { COMMAND_API_URL } from "..";

export type Request = {
  otherUserId: string;
};

export type Response = {
  friendRequestId: string;
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/send-friend-request/v1", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: COMMAND_API_URL,
    })
    .then((res) => res.data as Response);
};
