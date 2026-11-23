import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Languages } from "./Languages";
import {
  createLanguageMock,
  createLanguageRefusedMock,
  deleteLanguageMock,
  deleteLanguageRefusedMock,
  english,
  german,
  ISO_TAKEN,
  languagesMock,
  polish,
  updateLanguageMock,
  variablesFor,
} from "./languages.mocks";

// The page is the shared CatalogPage with the language requests; Departments.test.tsx covers the shared behaviour in
// full, and LanguageFormModal.test.tsx the fields of the modal. These tests check that each language request, the ISO
// and Native name columns, the ISO sort and every language text are wired.
type User = ReturnType<typeof renderWithProviders>["user"];

/** The cells of each data row: Name, ISO, Native name (the row menu cell is left out). */
const rows = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .slice(0, 3)
        .map((cell) => cell.textContent),
    );

async function fillForm(
  user: User,
  dialog: HTMLElement,
  values: { name: string; iso: string; nativeName: string },
) {
  await user.type(within(dialog).getByRole("textbox", { name: "Name" }), values.name);
  await user.type(within(dialog).getByRole("textbox", { name: "ISO" }), values.iso);
  await user.type(within(dialog).getByRole("textbox", { name: "Native name" }), values.nativeName);
}

describe("Languages", () => {
  it("shows the languages of the backend with their ISO code and native name, in the Figma column order", async () => {
    renderWithProviders(<Languages />, { mocks: [languagesMock([english, german, polish])] });

    expect(await screen.findByRole("table", { name: "Languages list" })).toBeInTheDocument();
    expect(await screen.findByText("German")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(
      expect.arrayContaining(["Name", "ISO", "Native name"]),
    );
    expect(rows()).toEqual([
      ["English", "EN", "English"],
      ["German", "DE", "Deutsch"],
      ["Polish", "PL", "Polski"],
    ]);
    expect(screen.getByRole("button", { name: "Actions for Polish" })).toBeInTheDocument();
  });

  it("sorts by Name and by ISO, but not by Native name (AC-9)", async () => {
    const { user } = renderWithProviders(<Languages />, {
      mocks: [
        languagesMock([english, german]),
        languagesMock([german, english], {
          variables: variablesFor({ sort: { field: "iso", direction: "ASC" } }),
        }),
      ],
    });
    await screen.findByText("EN");

    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Native name" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ISO" }));

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: "ISO" })).toHaveAttribute(
        "aria-sort",
        "ascending",
      ),
    );
    await waitFor(() =>
      expect(rows()).toEqual([
        ["German", "DE", "Deutsch"],
        ["English", "EN", "English"],
      ]),
    );
  });

  it("shows No languages found and the Polish texts", async () => {
    renderWithProviders(<Languages />, { locale: "pl", mocks: [languagesMock([])] });

    expect(screen.getByRole("button", { name: "UTWÓRZ JĘZYK" })).toBeInTheDocument();
    expect(await screen.findByText("Nie znaleziono języków")).toBeInTheDocument();
  });

  it("creates a language with an uppercase ISO code and shows it after the reload", async () => {
    const input = { name: "Polish", iso: "PL", nativeName: "Polski" };
    const { user } = renderWithProviders(<Languages />, {
      mocks: [
        languagesMock([english]),
        createLanguageMock(input, polish.id),
        languagesMock([english, polish]),
      ],
    });
    await screen.findByText("EN");
    await user.click(screen.getByRole("button", { name: "CREATE LANGUAGE" }));
    const dialog = await screen.findByRole("dialog", { name: "Create language" });

    await fillForm(user, dialog, { ...input, iso: "pl" });
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Polish was added to the languages.")).toBeInTheDocument();
    await waitFor(() =>
      expect(rows()).toEqual([
        ["English", "EN", "English"],
        ["Polish", "PL", "Polski"],
      ]),
    );
  });

  it("shows Language already exists for a taken name", async () => {
    const input = { name: "english", iso: "EO", nativeName: "English" };
    const { user } = renderWithProviders(<Languages />, {
      mocks: [languagesMock([english]), createLanguageRefusedMock(input)],
    });
    await screen.findByText("EN");
    await user.click(screen.getByRole("button", { name: "CREATE LANGUAGE" }));
    const dialog = await screen.findByRole("dialog", { name: "Create language" });

    await fillForm(user, dialog, input);
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("Language already exists")).toBeInTheDocument();
  });

  it("shows ISO code already exists for a taken ISO code", async () => {
    const input = { name: "British English", iso: "EN", nativeName: "English" };
    const { user } = renderWithProviders(<Languages />, {
      mocks: [languagesMock([english]), createLanguageRefusedMock(input, ISO_TAKEN)],
    });
    await screen.findByText("EN");
    await user.click(screen.getByRole("button", { name: "CREATE LANGUAGE" }));
    const dialog = await screen.findByRole("dialog", { name: "Create language" });

    await fillForm(user, dialog, input);
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("ISO code already exists")).toBeInTheDocument();
    expect(within(dialog).queryByText("Language already exists")).not.toBeInTheDocument();
  });

  it("updates a language: the new values show after the reload", async () => {
    const input = { name: "German", iso: "DE", nativeName: "Deutsch (Deutschland)" };
    const { user } = renderWithProviders(<Languages />, {
      mocks: [
        languagesMock([german]),
        updateLanguageMock(german.id, input),
        languagesMock([{ ...german, nativeName: input.nativeName }]),
      ],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for German" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog", { name: "Update language" });

    expect(within(dialog).getByRole("textbox", { name: "ISO" })).toHaveValue("DE");
    await user.type(within(dialog).getByRole("textbox", { name: "Native name" }), " (Deutschland)");
    await user.click(within(dialog).getByRole("button", { name: "Update" }));

    expect(await screen.findByText("German was saved.")).toBeInTheDocument();
    await waitFor(() => expect(rows()).toEqual([["German", "DE", "Deutsch (Deutschland)"]]));
  });

  it("deletes a language", async () => {
    const { user } = renderWithProviders(<Languages />, {
      mocks: [
        languagesMock([english, german]),
        deleteLanguageMock(english.id),
        languagesMock([german]),
      ],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for English" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Are you sure you want to delete language English?");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(rows()).toEqual([["German", "DE", "Deutsch"]]));
  });

  it("shows the in-use text for a language that is in use", async () => {
    const { user } = renderWithProviders(<Languages />, {
      mocks: [languagesMock([english]), deleteLanguageRefusedMock(english.id)],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for English" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );

    expect(
      await screen.findByText("Language cannot be deleted because it is currently in use"),
    ).toBeInTheDocument();
  });
});
