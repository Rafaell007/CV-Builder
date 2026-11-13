import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/components";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  backendCv,
  updateCvInvalidMock,
  updateCvMock,
  updateCvNetworkErrorMock,
} from "../../cvForm.mocks";
import { useUpdateCvForm } from "../../useUpdateCvForm";
import { UpdateCvModal } from "./UpdateCvModal";

// The page owns the hook; this small page opens the modal the same way.
function Harness() {
  const editing = useUpdateCvForm();
  return (
    <>
      <Button onClick={() => editing.open(backendCv)}>Open</Button>
      <UpdateCvModal update={editing} />
    </>
  );
}

// What the modal sends for the Backend CV after the name changed.
const input = {
  id: "1",
  name: "Backend CV 2",
  education: backendCv.education,
  description: backendCv.description,
};

async function open(options: RenderWithProvidersOptions = { mocks: [] }) {
  const view = renderWithProviders(<Harness />, options);
  await view.user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Update CV" });
  return { ...view, dialog };
}

async function renameTo(user: Awaited<ReturnType<typeof open>>["user"], name: string) {
  const field = screen.getByRole("textbox", { name: "Name" });
  await user.clear(field);
  await user.type(field, name);
}

describe("UpdateCvModal", () => {
  it("opens with the current data of the CV", async () => {
    await open();

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV");
    expect(screen.getByRole("textbox", { name: "Education" })).toHaveValue("MSc Computer Science");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Five years of Node.js",
    );
  });

  it("keeps SAVE disabled until something changes", async () => {
    const { user } = await open();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await renameTo(user, "Backend CV 2");

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("shows the same messages as Create CV and disables SAVE", async () => {
    const { user } = await open();

    await user.clear(screen.getByRole("textbox", { name: "Name" }));
    await user.click(screen.getByRole("dialog"));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves the CV with its id, then closes and shows a success toast", async () => {
    // The mock matches only this exact input: the id must be in the request.
    const { user } = await open({ mocks: [updateCvMock(input)] });

    await renameTo(user, "Backend CV 2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("CV updated")).toBeInTheDocument();
  });

  it("keeps the window open and every value when the request fails", async () => {
    const { user } = await open({ mocks: [updateCvNetworkErrorMock(input)] });

    await renameTo(user, "Backend CV 2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV 2");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Five years of Node.js",
    );
  });

  it("shows a field error from the server under its field", async () => {
    const { user } = await open({ mocks: [updateCvInvalidMock(input, "name")] });

    await renameTo(user, "Backend CV 2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("The server did not accept this value")).toBeInTheDocument();
    // The field error is the only message: the general one stays hidden.
    expect(screen.queryByText("Something went wrong. Please try again later")).toBeNull();
  });

  it("fills the form again with the CV each time it opens", async () => {
    const { user } = await open();
    await renameTo(user, "Something else");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Backend CV");
  });
});
