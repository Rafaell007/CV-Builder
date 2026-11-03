import { notFound } from "next/navigation";

// Unknown paths inside a language (/en/unknown) show [locale]/not-found.tsx in that language.
// https://next-intl.dev/docs/environments/error-files
export default function CatchAllPage() {
  notFound();
}
