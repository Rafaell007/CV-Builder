import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Positions } from "./Positions";
import {
  createPositionMock,
  createPositionRefusedMock,
  deletePositionMock,
  deletePositionRefusedMock,
  designer,
  developer,
  positionsMock,
  updatePositionMock,
} from "./positions.mocks";

// The page is the shared CatalogPage with the position requests; Departments.test.tsx covers the shared behaviour in
// full. These tests check that each position request and every position text is wired.
const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]!.textContent);

describe("Positions", () => {
  it("shows the positions of the backend", async () => {
    renderWithProviders(<Positions />, { mocks: [positionsMock([designer, developer])] });

    expect(await screen.findByRole("table", { name: "Positions list" })).toBeInTheDocument();
    expect(await screen.findByText("Designer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions for Developer" })).toBeInTheDocument();
  });

  it("shows No positions found and the Polish texts", async () => {
    renderWithProviders(<Positions />, { locale: "pl", mocks: [positionsMock([])] });

    expect(screen.getByRole("button", { name: "UTWÓRZ STANOWISKO" })).toBeInTheDocument();
    expect(await screen.findByText("Nie znaleziono stanowisk")).toBeInTheDocument();
  });

  it("creates a position and shows it after the reload", async () => {
    const { user } = renderWithProviders(<Positions />, {
      mocks: [
        positionsMock([designer]),
        createPositionMock("Tester"),
        positionsMock([designer, { ...designer, id: "new-1", name: "Tester" }]),
      ],
    });
    await screen.findByText("Designer");
    await user.click(screen.getByRole("button", { name: "CREATE POSITION" }));
    const dialog = await screen.findByRole("dialog", { name: "Create position" });

    await user.type(within(dialog).getByRole("textbox", { name: "Position" }), "Tester");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Tester was added to the positions.")).toBeInTheDocument();
    await waitFor(() => expect(names()).toEqual(["Designer", "Tester"]));
  });

  it("shows Position already exists for a taken name", async () => {
    const { user } = renderWithProviders(<Positions />, {
      mocks: [positionsMock([designer]), createPositionRefusedMock("designer")],
    });
    await screen.findByText("Designer");
    await user.click(screen.getByRole("button", { name: "CREATE POSITION" }));
    const dialog = await screen.findByRole("dialog", { name: "Create position" });

    await user.type(within(dialog).getByRole("textbox", { name: "Position" }), "designer");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("Position already exists")).toBeInTheDocument();
  });

  it("renames a position", async () => {
    const { user } = renderWithProviders(<Positions />, {
      mocks: [
        positionsMock([designer]),
        updatePositionMock(designer.id, "UX Designer"),
        positionsMock([{ ...designer, name: "UX Designer" }]),
      ],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for Designer" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit position" });
    const field = within(dialog).getByRole("textbox", { name: "Position" });

    await user.clear(field);
    await user.type(field, "UX Designer");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("UX Designer was saved.")).toBeInTheDocument();
    await waitFor(() => expect(names()).toEqual(["UX Designer"]));
  });

  it("deletes a position", async () => {
    const { user } = renderWithProviders(<Positions />, {
      mocks: [
        positionsMock([designer, developer]),
        deletePositionMock(designer.id),
        positionsMock([developer]),
      ],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for Designer" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Are you sure you want to delete position Designer?");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(names()).toEqual(["Developer"]));
  });

  it("shows the in-use text for a position that is in use", async () => {
    const { user } = renderWithProviders(<Positions />, {
      mocks: [positionsMock([designer]), deletePositionRefusedMock(designer.id)],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for Designer" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );

    expect(
      await screen.findByText("Position cannot be deleted because it is currently in use"),
    ).toBeInTheDocument();
    // The rows are behind the open modal (hidden for assistive tech): close it with Cancel first.
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
    );
    expect(names()).toEqual(["Designer"]);
  });
});
