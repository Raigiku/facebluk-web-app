import axios from "axios";
import { EVENT_STORE_API_URL } from "..";

export type Request = {
  friendRequestId: string
};

export const apiCall = (request: Request, bearerToken: string) => {
  return axios
    .post("/api/friend-requests/reject", request, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: EVENT_STORE_API_URL,
    })
    .then((res) => res.data);
};
