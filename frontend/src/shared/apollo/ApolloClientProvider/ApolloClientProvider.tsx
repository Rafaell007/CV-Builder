"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import type { ReactNode } from "react";
import { env } from "@/env";
import { redirectToSignIn, refreshSession } from "@/shared/session";
import { errorLink } from "../errorLink";
import { networkErrorLink } from "../networkErrorLink";
import { createSessionLink } from "../sessionLink";

// The frontend's own /graphql, rewritten to the backend (PLAN D8): the browser sends its cookies itself.
// Absolute, because this also runs once on the server while the page is rendered.
// The session link (refresh and retry, PLAN D9) runs in the browser only: on the server, the proxy has
// already refreshed the session before the page renders. The network error link (No Internet screen)
// is browser only too: its store belongs to one browser tab.
function makeClient() {
  const browserLinks =
    typeof window === "undefined"
      ? []
      : [
          networkErrorLink,
          createSessionLink({ refresh: refreshSession, onSessionEnded: redirectToSignIn }),
        ];
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      errorLink,
      ...browserLinks,
      new HttpLink({ uri: `${env.appUrl}/graphql` }),
    ]),
  });
}

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
