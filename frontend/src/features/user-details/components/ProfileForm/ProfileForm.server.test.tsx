import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { loadMessages } from "@/i18n/loadMessages";
import type { UseCatalogOptionsResult } from "@/shared/catalogOptions";
import { ProfileForm } from "./ProfileForm";

// The server HTML of the form (PLAN D6): the user's values must be in it, not only after hydration. On the page the
// options are preloaded on the server; here the two options hooks return a loaded list, so nothing suspends.
const loaded = (options: UseCatalogOptionsResult["options"]): UseCatalogOptionsResult => ({
  options,
  loading: false,
  failed: false,
  retry: vi.fn(),
});

vi.mock("@/shared/catalogOptions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/catalogOptions")>()),
  useSuspenseDepartmentOptions: () => loaded([{ id: "d1", name: "React" }]),
  useSuspensePositionOptions: () => loaded([{ id: "p1", name: "Software Engineer" }]),
}));

const messages = await loadMessages("en");

describe("ProfileForm on the server", () => {
  it.each([true, false])("has the user's values in the HTML (canEdit: %s)", (canEdit) => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProfileForm
          canEdit={canEdit}
          user={{
            firstName: "Emma",
            lastName: "Employee",
            department: { __typename: "Department", id: "d1", name: "React" },
            position: { __typename: "Position", id: "p1", name: "Software Engineer" },
          }}
        />
      </NextIntlClientProvider>,
    );

    expect(html).toContain('value="Emma"');
    expect(html).toContain('value="Employee"');
    expect(html).toContain("React");
    expect(html).toContain("Software Engineer");
  });
});
