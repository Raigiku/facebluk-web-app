import { ApolloClient, InMemoryCache } from "@apollo/client";
export * as User from "./user";

export const graphqlClient = new ApolloClient({
  uri:
    process.env.ENVIRONMENT === "local"
      ? "http://localhost:4000"
      : (() => {
          throw new Error("ENVIRONMENT var undefined");
        })(),
  cache: new InMemoryCache(),
});
