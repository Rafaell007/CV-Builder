import { act, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { meMock, userMock } from "../../user-details.mocks";
import { UserProfile } from "./UserProfile";

// The tab reads `me` and `user(id)` with useSuspenseQuery; on the page the route layout preloads both on the server.
// React 19 shows a suspended tree only inside an awaited act(); without it the fallback never leaves.
const setup = async (user = userMock("10"), locale: "en" | "pl" = "en") => {
  await act(async () => {
    renderWithProviders(
      <Suspense fallback={<p>Suspended</p>}>
        <UserProfile userId="10" />
      </Suspense>,
      { mocks: [meMock("USER"), user], locale },
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
});
