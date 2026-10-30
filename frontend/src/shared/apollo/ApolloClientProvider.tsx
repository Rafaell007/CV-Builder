"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import type { ReactNode } from "react";
import { env } from "@/env";
import { errorLink } from "./errorLink";

// The frontend's own /graphql, rewritten to the backend (PLAN D8): the browser sends its cookies itself.
// Absolute, because this also runs once on the server while the page is rendered.
function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([errorLink, new HttpLink({ uri: `${env.appUrl}/graphql` })]),
  });
}

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
