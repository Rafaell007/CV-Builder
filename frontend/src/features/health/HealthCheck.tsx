import { connection } from "next/server";
import { Suspense } from "react";
import { PreloadQuery } from "@/shared/apollo/server";
import { HealthDocument } from "@/shared/graphql";
import { ClientHealth } from "./components/ClientHealth";
import { ServerHealth } from "./components/ServerHealth";

// Shows the health status twice: queried by a Server Component, and preloaded on the server into
// a Client Component's cache. Render it inside <Suspense>.
export async function HealthCheck() {
  // Per-request data (cookies): render at request time, not at build time (PLAN D6).
  await connection();

  return (
    <section>
      <ServerHealth />
      <PreloadQuery query={HealthDocument}>
        <Suspense>
          <ClientHealth />
        </Suspense>
      </PreloadQuery>
    </section>
  );
}
