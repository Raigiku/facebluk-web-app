export * from './errors';
export * as ApiRegisterUser from "./register-user-route";

export const EVENT_STORE_API_URL =
  process.env.ENVIRONMENT === "local"
    ? "http://localhost:3000"
    : (() => {
        throw new Error("ENVIRONMENT var undefined");
      })();
