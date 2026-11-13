import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { backendCv, updateCvMock, updateCvNetworkErrorMock } from "../../cvForm.mocks";
import { useCvDetailsForm } from "../../useCvDetailsForm";
import { CvDetailsForm } from "./CvDetailsForm";

// The page owns the hook; this small component gives the form the same input.
function Harness() {
  return <CvDetailsForm details={useCvDetailsForm(backendCv)} />;
}

const input = {
  id: backendCv.id,
  name: "Backend CV 2",
  education: backendCv.education,
  description: backendCv.description,
};

function setup(options: RenderWithProvidersOptions = { mocks: [] }) {
  return renderWithProviders(<Harness />, options);
}

const updateButton = () => screen.getByRole("button", { name: "UPDATE" });

describe("CvDetailsForm", () => {
  it("shows Name, Education and Description filled with the CV", () => {
    setup();

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV");
    expect(screen.getByRole("textbox", { name: "Education" })).toHaveValue("MSc Computer Science");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Five years of Node.js",
    );
  });

  it("disables UPDATE while nothing was changed", () => {
    setup();

    expect(updateButton()).toBeDisabled();
  });

  it("enables UPDATE after a change, and disables it again when the change is undone", async () => {
    const { user } = setup();
    const name = screen.getByRole("textbox", { name: "Name" });

    await user.type(name, "2");
    expect(updateButton()).toBeEnabled();

    await user.type(name, "{Backspace}");
    expect(updateButton()).toBeDisabled();
  });

  it("shows the message and disables UPDATE when a required field is empty", async () => {
    const { user } = setup();

    await user.clear(screen.getByRole("textbox", { name: "Description" }));
    // The message shows after the field was left (`useZodForm` validates on touch).
    await user.tab();

    expect(await screen.findByText("Description is required")).toBeInTheDocument();
    expect(updateButton()).toBeDisabled();
  });

  it("shows the message when the name is longer than 255 characters", async () => {
    const { user } = setup();
    const name = screen.getByRole("textbox", { name: "Name" });

    await user.clear(name);
    await user.click(name);
    await user.paste("a".repeat(256));
    await user.tab();

    expect(await screen.findByText("Name must not exceed 255 characters")).toBeInTheDocument();
    expect(updateButton()).toBeDisabled();
  });

  it("saves the change, keeps the new value and disables UPDATE again", async () => {
    const { user } = setup({ mocks: [updateCvMock(input)] });
    await user.type(screen.getByRole("textbox", { name: "Name" }), " 2");

    await user.click(updateButton());

    expect(await screen.findByText("CV updated")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV 2");
    expect(updateButton()).toBeDisabled();
  });

  it("shows the loading state while the request runs and sends only one request", async () => {
    // One mock: a second request would find no mock and the form would show the general error.
    const { user } = setup({ mocks: [{ ...updateCvMock(input), delay: 50 }] });
    await user.type(screen.getByRole("textbox", { name: "Name" }), " 2");

    await user.click(updateButton());
    await user.click(updateButton());

    expect(updateButton()).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByText("CV updated")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the typed values and shows a message when the request fails", async () => {
    const { user } = setup({ mocks: [updateCvNetworkErrorMock(input)] });
    await user.type(screen.getByRole("textbox", { name: "Name" }), " 2");

    await user.click(updateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV 2");
    expect(updateButton()).toBeEnabled();
  });
});
