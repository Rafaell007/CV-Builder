import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/components";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  blog,
  updateProjectInvalidMock,
  updateProjectMock,
  environmentOptionsMock,
  updateProjectNetworkErrorMock,
} from "../../projects.mocks";
import { useUpdateProjectForm } from "../../useUpdateProjectForm";
import { UpdateProjectModal } from "./UpdateProjectModal";

// The page owns the hook; this small page opens the modal the same way.
function Harness() {
  const editing = useUpdateProjectForm();
  return (
    <>
      <Button onClick={() => editing.open(blog)}>Open</Button>
      <UpdateProjectModal update={editing} />
    </>
  );
}

// What the modal sends for the Blog project after the name changed: the dates and the technologies are the old ones.
const input = {
  id: "1",
  name: "Blog 2",
  domain: "Blogging",
  startDate: "2025-12-31T00:00:00.000Z",
  endDate: "2026-05-31T00:00:00.000Z",
  description: blog.description,
  environmentIds: ["10", "11", "12", "13", "14", "15"],
};

async function open(options: RenderWithProvidersOptions = { mocks: [] }) {
  // Every form asks the backend for the skills, so each test also answers that request.
  const view = renderWithProviders(<Harness />, {
    ...options,
    mocks: [...(options.mocks ?? []), environmentOptionsMock()],
  });
  await view.user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Update project" });
  return { ...view, dialog };
}

// The field is disabled while the skills load; wait until it can be used.
async function openEnvironment() {
  const field = await screen.findByRole("combobox", { name: "Environment" });
  await waitFor(() => expect(field).not.toHaveAttribute("aria-disabled", "true"));
  return field;
}

async function renameTo(user: Awaited<ReturnType<typeof open>>["user"], name: string) {
  const field = screen.getByRole("textbox", { name: "Name" });
  await user.clear(field);
  await user.type(field, name);
}

describe("UpdateProjectModal", () => {
  it("opens with the current data of the project", async () => {
    await open();

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Blog");
    expect(screen.getByRole("textbox", { name: "Domain" })).toHaveValue("Blogging");
    expect(screen.getByRole("textbox", { name: "Start Date" })).toHaveValue("12/31/2025");
    expect(screen.getByRole("textbox", { name: "End Date" })).toHaveValue("05/31/2026");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(blog.description);
  });

  it("shows the technologies of the project as chips", async () => {
    await open();

    const chips = await screen.findByRole("group", { name: "Environment" });
    expect(
      within(chips)
        .getAllByRole("button")
        .map((chip) => chip.getAttribute("aria-label")),
    ).toEqual([
      "Remove HTML5",
      "Remove CSS3",
      "Remove TypeScript",
      "Remove React",
      "Remove Zustand",
      "Remove Firebase",
    ]);
  });

  it("sends the technologies the user changed, not the old ones", async () => {
    const changed = { ...input, name: "Blog", environmentIds: ["10", "11", "12", "13", "14"] };
    const { user } = await open({
      mocks: [updateProjectMock(changed, blog.environment.slice(0, 5))],
    });
    await user.click(await screen.findByRole("button", { name: "Remove Firebase" }));

    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Project updated")).toBeInTheDocument();
  });

  it("adds a technology from the list", async () => {
    const changed = { ...input, name: "Blog", environmentIds: [...input.environmentIds, "16"] };
    const { user } = await open({ mocks: [updateProjectMock(changed, blog.environment)] });
    await user.click(await openEnvironment());

    await user.click(await screen.findByRole("option", { name: "MobX" }));
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps UPDATE disabled until something changes", async () => {
    const { user } = await open();
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();

    await renameTo(user, "Blog 2");

    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
  });

  it("shows the same messages as Create project and disables UPDATE", async () => {
    const { user } = await open();

    await user.clear(screen.getByRole("textbox", { name: "Name" }));
    await user.click(screen.getByRole("dialog"));

    expect(await screen.findByText("Project name is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
  });

  it("saves the project with its id and keeps its technologies, then closes", async () => {
    // The mock matches only this exact input: the id and the environment ids must be in the request.
    const { user } = await open({ mocks: [updateProjectMock(input, blog.environment)] });

    await renameTo(user, "Blog 2");
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Project updated")).toBeInTheDocument();
  });

  it("keeps the window open and every value when the request fails", async () => {
    const { user } = await open({ mocks: [updateProjectNetworkErrorMock(input)] });

    await renameTo(user, "Blog 2");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Blog 2");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(blog.description);
  });

  it("shows a field error from the server under its field", async () => {
    const { user } = await open({ mocks: [updateProjectInvalidMock(input, ["name"])] });

    await renameTo(user, "Blog 2");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("The server did not accept this value")).toBeInTheDocument();
    // The field error is the only message: the general one stays hidden.
    expect(screen.queryByText("Something went wrong. Please try again later")).toBeNull();
  });

  it("fills the form again with the project each time it opens", async () => {
    const { user } = await open();
    await renameTo(user, "Something else");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Blog");
  });
});
