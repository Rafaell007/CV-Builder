import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/components";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createCvInvalidMock,
  createCvMock,
  createCvNetworkErrorMock,
  createCvRefusedMock,
  createInput,
} from "../../cvForm.mocks";
import { useCreateCvForm } from "../../useCreateCvForm";
import { CreateCvModal } from "./CreateCvModal";

// The page owns the hook; this small page opens the modal the same way.
function Harness() {
  const creation = useCreateCvForm();
  return (
    <>
      <Button onClick={creation.open}>Open</Button>
      <CreateCvModal creation={creation} />
    </>
  );
}

async function open(options: RenderWithProvidersOptions = { mocks: [] }) {
  const view = renderWithProviders(<Harness />, options);
  await view.user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Create CV" });
  return { ...view, dialog };
}

async function fill(user: Awaited<ReturnType<typeof open>>["user"]) {
  await user.type(screen.getByRole("textbox", { name: "Name" }), createInput.name);
  await user.type(screen.getByRole("textbox", { name: "Education" }), createInput.education);
  await user.type(screen.getByRole("textbox", { name: "Description" }), createInput.description);
}

describe("CreateCvModal", () => {
  it("opens with three empty fields and a disabled CREATE button", async () => {
    await open();

    for (const name of ["Name", "Education", "Description"]) {
      expect(screen.getByRole("textbox", { name })).toHaveValue("");
    }
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("enables CREATE when every field is valid", async () => {
    const { user } = await open();

    await fill(user);

    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("shows the required messages after the fields were left", async () => {
    const { user } = await open();

    for (const name of ["Name", "Education", "Description"]) {
      await user.click(screen.getByRole("textbox", { name }));
    }
    await user.click(screen.getByRole("dialog"));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Education is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("shows the length messages and does not cut pasted text", async () => {
    const { user } = await open();

    await user.click(screen.getByRole("textbox", { name: "Name" }));
    await user.paste("n".repeat(256));
    await user.click(screen.getByRole("textbox", { name: "Education" }));
    await user.paste("e".repeat(256));
    await user.click(screen.getByRole("textbox", { name: "Description" }));
    await user.paste("d".repeat(2001));
    await user.click(screen.getByRole("textbox", { name: "Name" }));

    expect(await screen.findByText("Name must not exceed 255 characters")).toBeInTheDocument();
    expect(screen.getByText("Education must not exceed 255 characters")).toBeInTheDocument();
    expect(screen.getByText("Description must not exceed 2000 characters")).toBeInTheDocument();
  });

  it("sends the values, closes the modal and shows a success toast", async () => {
    const { user, dialog } = await open({ mocks: [createCvMock(createInput)] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("CV created")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("is empty again when it opens a second time", async () => {
    const { user } = await open({ mocks: [createCvMock(createInput)] });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("");
  });

  it("keeps the values and shows a message when the request fails", async () => {
    const { user, dialog } = await open({ mocks: [createCvNetworkErrorMock(createInput)] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByRole("dialog", { name: "Create CV" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Frontend CV");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("React and CSS");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("shows the general message and keeps the values when the employee is not found (NOT_FOUND)", async () => {
    const { user, dialog } = await open({ mocks: [createCvRefusedMock(createInput)] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByRole("dialog", { name: "Create CV" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Frontend CV");
    expect(screen.getByRole("textbox", { name: "Education" })).toHaveValue(createInput.education);
  });

  it("shows a field error from the backend under its field and keeps the values", async () => {
    const { user, dialog } = await open({ mocks: [createCvInvalidMock(createInput, "name")] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText("The server did not accept this value"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Frontend CV");
    // A field error is not the general message of the modal.
    expect(
      within(dialog).queryByText("Something went wrong. Please try again later"),
    ).not.toBeInTheDocument();
  });

  it("closes without a request on CANCEL", async () => {
    const { user, dialog } = await open();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
