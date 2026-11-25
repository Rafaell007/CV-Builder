import { act, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import {
  departmentOptionsMock,
  meMock,
  positionOptionsMock,
  userMock,
} from "../../user-details.mocks";
import { UserProfile } from "./UserProfile";

// The tab reads `me`, `user(id)` and the form options with useSuspenseQuery; on the page the route preloads them on
// the server. React 19 shows a suspended tree only inside an awaited act(); without it the fallback never leaves.
// The signed-in user of `meMock` has id "1"; the page shows user "10".
const setup = async (
  user = userMock("10"),
  locale: "en" | "pl" = "en",
  role: "ADMIN" | "USER" = "USER",
) => {
  await act(async () => {
    renderWithProviders(
      <Suspense fallback={<p>Suspended</p>}>
        <UserProfile userId="10" />
      </Suspense>,
      { mocks: [meMock(role), user, departmentOptionsMock(), positionOptionsMock()], locale },
    );
  });
};

describe("UserProfile", () => {
  it("shows the initials, the name, the email and the day the user joined", async () => {
    await setup();

    const profile = await screen.findByRole("region", { name: "Emma Employee" });
    expect(profile).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Emma Employee" })).toHaveTextContent("EE");
    expect(screen.getByRole("heading", { level: 2, name: "Emma Employee" })).toBeInTheDocument();
    expect(screen.getByText("emma@example.com")).toBeInTheDocument();
    expect(screen.getByText("A member since Sun, Jan 14, 2024")).toBeInTheDocument();
  });

  it("names a user without a name by the email and does not repeat it", async () => {
    await setup(userMock("10", { firstName: null, lastName: null }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "emma@example.com" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("emma@example.com")).toHaveLength(1);
  });

  it("writes the day in the language of the page", async () => {
    await setup(userMock("10"), "pl");

    expect(await screen.findByText("Członek od niedz., 14 sty 2024")).toBeInTheDocument();
  });

  it("shows another employee's profile read-only", async () => {
    await setup();

    expect(await screen.findByRole("textbox", { name: /First Name/ })).toHaveAttribute("readonly");
  });

  it("lets an Admin edit any profile", async () => {
    await setup(userMock("10"), "en", "ADMIN");

    expect(await screen.findByRole("textbox", { name: /First Name/ })).not.toHaveAttribute(
      "readonly",
    );
  });
});
