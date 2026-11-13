import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/components";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createProjectInvalidMock,
  createProjectMock,
  createProjectNetworkErrorMock,
  environmentOptionsErrorMock,
  environmentOptionsMock,
} from "../../projects.mocks";
import { useCreateProjectForm } from "../../useCreateProjectForm";
import { CreateProjectModal } from "./CreateProjectModal";

// The page owns the hook; this small page opens the modal the same way.
function Harness() {
  const creation = useCreateProjectForm();
  return (
    <>
      <Button onClick={creation.open}>Open</Button>
      <CreateProjectModal creation={creation} />
    </>
  );
}

const input = {
  name: "Blog",
  domain: "Blogging",
  startDate: "2026-01-10T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  description: "A blogging site",
  environmentIds: [],
};

async function open(options: RenderWithProvidersOptions = { mocks: [] }) {
  // Every form asks the backend for the skills, so each test also answers that request.
  const view = renderWithProviders(<Harness />, {
    ...options,
    mocks: [...(options.mocks ?? []), environmentOptionsMock()],
  });
  await view.user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Create project" });
  return { ...view, dialog };
}

// The field is disabled while the skills load; wait until it can be used.
async function openEnvironment() {
  const field = await screen.findByRole("combobox", { name: "Environment" });
  await waitFor(() => expect(field).not.toHaveAttribute("aria-disabled", "true"));
  return field;
}

async function fill(user: Awaited<ReturnType<typeof open>>["user"], overrides = {}) {
  const values = { ...input, ...overrides };
  await user.type(screen.getByRole("textbox", { name: "Name" }), values.name);
  await user.type(screen.getByRole("textbox", { name: "Domain" }), values.domain);
  await user.type(screen.getByRole("textbox", { name: "Start Date" }), "01/10/2026");
  await user.type(screen.getByRole("textbox", { name: "End Date" }), "06/30/2026");
  await user.type(screen.getByRole("textbox", { name: "Description" }), values.description);
}

describe("CreateProjectModal", () => {
  it("opens with five empty fields and a disabled CREATE button", async () => {
    await open();

    for (const name of ["Name", "Domain", "Start Date", "End Date", "Description"]) {
      expect(screen.getByRole("textbox", { name })).toHaveValue("");
    }
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("has an Environment field that lists the skills of the backend", async () => {
    const { user } = await open();

    await user.click(await openEnvironment());

    const names = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(names).toEqual(["CSS3", "Firebase", "HTML5", "MobX", "React", "TypeScript", "Zustand"]);
  });

  it("sends the chosen technologies and allows none", async () => {
    const { user } = await open({
      mocks: [createProjectMock({ ...input, environmentIds: ["13", "12"] })],
    });
    await fill(user);
    await user.click(await openEnvironment());
    await user.click(await screen.findByRole("option", { name: "React" }));
    await user.click(screen.getByRole("option", { name: "TypeScript" }));

    await user.click(screen.getByRole("button", { name: "Create" }));

    // The mock matches only this exact input, in the order the user chose.
    expect(await screen.findByText("Project created")).toBeInTheDocument();
  });

  it("disables the Environment field while the skills load", async () => {
    // A delayed answer keeps the request pending, so a slow machine cannot finish loading before the check.
    await open({ mocks: [{ ...environmentOptionsMock(), delay: 10_000 }] });

    expect(screen.getByRole("combobox", { name: "Environment" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Loading technologies")).toBeInTheDocument();
  });

  it("shows an error with a retry when the skills fail, and the form can still be sent", async () => {
    const { user } = await open({
      mocks: [environmentOptionsErrorMock(), createProjectMock(input)],
    });

    expect(await screen.findByText("The technologies could not be loaded.")).toBeInTheDocument();
    await fill(user);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Project created")).toBeInTheDocument();
  });

  it("enables CREATE when every field is valid", async () => {
    const { user } = await open();

    await fill(user);

    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("shows the required messages after the fields were left", async () => {
    const { user } = await open();

    for (const name of ["Name", "Domain", "Start Date", "End Date", "Description"]) {
      await user.click(screen.getByRole("textbox", { name }));
    }
    await user.click(screen.getByRole("dialog"));

    expect(await screen.findByText("Project name is required")).toBeInTheDocument();
    expect(screen.getByText("Domain is required")).toBeInTheDocument();
    expect(screen.getByText("Start date is required")).toBeInTheDocument();
    expect(screen.getByText("End date is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("shows the length messages and does not cut pasted text", async () => {
    const { user } = await open();

    await user.click(screen.getByRole("textbox", { name: "Name" }));
    await user.paste("n".repeat(101));
    await user.click(screen.getByRole("textbox", { name: "Description" }));
    await user.paste("x".repeat(2001));
    await user.click(screen.getByRole("textbox", { name: "Domain" }));

    expect(
      await screen.findByText("Project name must not exceed 100 characters"),
    ).toBeInTheDocument();
    expect(screen.getByText("Description must not exceed 2000 characters")).toBeInTheDocument();
  });

  it("refuses an end date earlier than the start date", async () => {
    const { user } = await open();

    await user.type(screen.getByRole("textbox", { name: "Start Date" }), "06/30/2026");
    await user.type(screen.getByRole("textbox", { name: "End Date" }), "01/10/2026");
    await user.click(screen.getByRole("textbox", { name: "Name" }));

    expect(await screen.findByText("End date must be later than start date")).toBeInTheDocument();
  });

  it("sends the values, closes the modal and shows a success toast", async () => {
    const { user, dialog } = await open({ mocks: [createProjectMock(input)] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Project created")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("is empty again when it opens a second time", async () => {
    const { user } = await open({ mocks: [createProjectMock(input)] });
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("");
  });

  it("keeps the values and shows a message when the request fails", async () => {
    const { user, dialog } = await open({ mocks: [createProjectNetworkErrorMock(input)] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByRole("dialog", { name: "Create project" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Blog");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("A blogging site");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("shows a field error from the backend under its field and keeps the values", async () => {
    const { user, dialog } = await open({ mocks: [createProjectInvalidMock(input, ["name"])] });
    await fill(user);

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText("The server did not accept this value"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Blog");
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
