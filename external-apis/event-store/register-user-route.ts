import axios from "axios";
import { EVENT_STORE_API_URL } from ".";

export type Request = {
  readonly name: string;
  readonly profilePicture: File | null;
};

export const apiCall = (body: Request, bearerToken: string) => {
  const data = new FormData();
  data.append("name", body.name);
  if (body.profilePicture !== null)
    data.append("profilePicture", body.profilePicture);

  return axios
    .postForm("/api/users/register", data, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: EVENT_STORE_API_URL,
    })
    .then((res) => res.data);
};
