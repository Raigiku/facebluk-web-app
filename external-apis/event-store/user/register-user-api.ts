import axios from "axios";
import { EVENT_STORE_API_URL } from "..";

export type Request = {
  name: string;
  alias: string;
  profilePicture: File | null;
};

export const apiCall = (request: Request, bearerToken: string) => {
  const data = new FormData();
  data.append("name", request.name);
  data.append("alias", request.alias);
  if (request.profilePicture !== null)
    data.append("profilePicture", request.profilePicture);

  return axios
    .postForm("/api/users/register", data, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: EVENT_STORE_API_URL,
    })
    .then((res) => res.data);
};
