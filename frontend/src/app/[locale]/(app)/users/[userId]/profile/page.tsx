import { connection } from "next/server";
import { PreloadQuery } from "@/shared/apollo/server";
import { DepartmentOptionsDocument, PositionOptionsDocument } from "@/shared/graphql";
import UserTabPlaceholderPage from "../placeholderPage";

// The Profile tab (PLAN S6.3). Starts the Department and Position options of the form on the server, per request
// (PLAN D6), for every viewer: the lists are small, and the server does not need to know who may edit. The form reads
// them with `useSuspenseDepartmentOptions` / `useSuspensePositionOptions`, so the browser sends no request of its own.
// The page renders inside the `<Suspense>` of `../layout.tsx`, which per-request work needs.
export default async function UserProfilePage() {
  await connection();

  return (
    <PreloadQuery query={DepartmentOptionsDocument}>
      <PreloadQuery query={PositionOptionsDocument}>
        <UserTabPlaceholderPage />
      </PreloadQuery>
    </PreloadQuery>
  );
}
