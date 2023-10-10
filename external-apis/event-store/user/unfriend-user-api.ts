import axios from "axios";
import { COMMAND_API_URL } from "..";

export type Request = {
  otherUserId: string;
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/unfriend-user/v1", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: COMMAND_API_URL,
    })
    .then((res) => res.data);
};
