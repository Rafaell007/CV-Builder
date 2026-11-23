import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { english, german } from "../languages.mocks";
import type { LanguageInput, LanguageListItem } from "../languages.types";
import { useCreateLanguageForm } from "../useCreateLanguageForm";
import { useUpdateLanguageForm } from "../useUpdateLanguageForm";
import { LanguageFormModal } from "./LanguageFormModal";

// The modal takes the state of a real flow hook, so the test drives it like the page does.
function CreateHarness({
  create = vi.fn(),
}: {
  create?: (input: LanguageInput) => Promise<LanguageListItem>;
}) {
  const creation = useCreateLanguageForm(create);
  return (
    <>
      <button type="button" onClick={creation.open}>
        Open
      </button>
      <LanguageFormModal kind="create" languageForm={creation} />
    </>
  );
}

function UpdateHarness({
  update,
}: {
  update: (id: string, input: LanguageInput) => Promise<LanguageListItem>;
}) {
  const editing = useUpdateLanguageForm(update);
  return (
    <>
      <button type="button" onClick={() => editing.open(german)}>
        Open
      </button>
      <LanguageFormModal kind="update" languageForm={editing} />
    </>
  );
}

async function openDialog(user: ReturnType<typeof renderWithProviders>["user"], name: string) {
  await user.click(screen.getByRole("button", { name: "Open" }));
  return screen.findByRole("dialog", { name });
}

describe("LanguageFormModal", () => {
  it("is closed until the flow opens it", () => {
    renderWithProviders(<CreateHarness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("create: sends the three typed values, and Create waits for all of them", async () => {
    const create = vi.fn().mockResolvedValue(english);
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create language");
    const submit = within(dialog).getByRole("button", { name: "Create" });

    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "English");
    await user.type(within(dialog).getByRole("textbox", { name: "ISO" }), "EN");
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByRole("textbox", { name: "Native name" }), "English");
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(create).toHaveBeenCalledExactlyOnceWith({
      name: "English",
      iso: "EN",
      nativeName: "English",
    });
  });

  it("shows the typed ISO letters uppercase at once", async () => {
    const { user } = renderWithProviders(<CreateHarness />);
    const dialog = await openDialog(user, "Create language");
    const iso = within(dialog).getByRole("textbox", { name: "ISO" });

    await user.type(iso, "pt-br");

    expect(iso).toHaveValue("PT-BR");
  });

  it("keeps the cursor in place when a letter is typed in the middle of the ISO code", async () => {
    const { user } = renderWithProviders(<CreateHarness />);
    const dialog = await openDialog(user, "Create language");
    const iso = within(dialog).getByRole("textbox", { name: "ISO" });
    await user.type(iso, "pt");

    await user.type(iso, "-", { initialSelectionStart: 1, initialSelectionEnd: 1 });

    expect(iso).toHaveValue("P-T");
    expect(iso).toHaveProperty("selectionStart", 2);
  });

  it("shows the message of an invalid ISO code under the field", async () => {
    const { user } = renderWithProviders(<CreateHarness />);
    const dialog = await openDialog(user, "Create language");
    const iso = within(dialog).getByRole("textbox", { name: "ISO" });

    await user.type(iso, "e1");
    await user.tab();

    expect(
      await within(dialog).findByText("ISO may contain only the letters A-Z and one hyphen"),
    ).toBeInTheDocument();
  });

  it("update: shows the values of the language, and Update waits for a change", async () => {
    const update = vi.fn().mockResolvedValue(german);
    const { user } = renderWithProviders(<UpdateHarness update={update} />);
    const dialog = await openDialog(user, "Update language");
    const submit = within(dialog).getByRole("button", { name: "Update" });
    const nativeName = within(dialog).getByRole("textbox", { name: "Native name" });

    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("German");
    expect(within(dialog).getByRole("textbox", { name: "ISO" })).toHaveValue("DE");
    expect(nativeName).toHaveValue("Deutsch");
    expect(submit).toBeDisabled();

    await user.type(nativeName, "!");
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(update).toHaveBeenCalledExactlyOnceWith("2", {
      name: "German",
      iso: "DE",
      nativeName: "Deutsch!",
    });
  });

  it("shows the general message when the request fails for another reason", async () => {
    const create = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create language");

    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "English");
    await user.type(within(dialog).getByRole("textbox", { name: "ISO" }), "EN");
    await user.type(within(dialog).getByRole("textbox", { name: "Native name" }), "English");
    const submit = within(dialog).getByRole("button", { name: "Create" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
  });
});
