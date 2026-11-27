import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { meMock, userCvsMock } from "../../user-details.mocks";
import { UserCvs } from "./UserCvs";

// Cvs opens the CV Preview with the router; no app router is mounted in a unit test.
vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push: vi.fn() }),
  ),
);

const annaCv = {
  id: "1",
  name: "Frontend Developer",
  education: "MSc Computer Science",
  ownerEmail: "anna@example.com",
};

describe("UserCvs", () => {
  it("shows the CVs of the user to an admin, with the create button and no second heading", async () => {
    renderWithProviders(<UserCvs userId="10" />, {
      mocks: [meMock("ADMIN"), userCvsMock("10", [annaCv])],
    });

    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CREATE CV" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows No CVs found when the user has none", async () => {
    renderWithProviders(<UserCvs userId="10" />, {
      mocks: [meMock("ADMIN"), userCvsMock("10", [])],
    });

    expect(await screen.findByText("No CVs found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CREATE CV" })).toBeInTheDocument();
  });

  it("shows no CVs and no controls to a user who is not an admin", async () => {
    renderWithProviders(<UserCvs userId="10" />, {
      mocks: [meMock("USER"), userCvsMock("10", [annaCv])],
    });

    expect(await screen.findByText("Only Admin users can open this page.")).toBeInTheDocument();
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CREATE CV" })).not.toBeInTheDocument();
  });
});
