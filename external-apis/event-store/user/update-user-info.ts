import axios from "axios";
import { COMMAND_API_URL } from "..";

export type Request = {
  name: string;
  profilePicture: File | null;
};

export const apiCall = (request: Request, bearerToken: string) => {
  const data = new FormData();
  data.append("name", request.name);
  if (request.profilePicture !== null)
    data.append("profilePicture", request.profilePicture);

  return axios
    .postForm("/update-user-info/v1", data, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      baseURL: COMMAND_API_URL,
    })
    .then((res) => res.data);
};
