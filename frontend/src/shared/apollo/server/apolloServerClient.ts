import "server-only";
import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { cookies } from "next/headers";
import { serverEnv } from "@/server/env";
import { createCookieLink } from "../cookieLink";
import { errorLink } from "../errorLink";

// One client per request. It calls the backend directly (no rewrite needed on the server) and
// forwards the user's cookies. Reading cookies makes the caller dynamic: wrap it in <Suspense>.
export const { getClient, query, PreloadQuery } = registerApolloClient(
  () =>
    new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.from([
        errorLink,
        createCookieLink(async () => (await cookies()).toString()),
        new HttpLink({ uri: `${serverEnv.backendUrl}/graphql` }),
      ]),
    }),
);
