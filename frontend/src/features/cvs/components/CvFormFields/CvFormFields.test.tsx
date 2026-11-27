import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { useCvForm } from "../../useCvForm";
import { CvFormFields } from "./CvFormFields";

// The modal owns the hook; this small form gives the fields the same input.
function Harness({ failed = false }: { failed?: boolean }) {
  const cvForm = useCvForm({ name: "Backend CV", education: "", description: "" });
  return <CvFormFields cvForm={{ form: cvForm.form, failed }} />;
}

describe("CvFormFields", () => {
  it("shows the three required fields with the values of the form", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV");
    expect(screen.getByRole("textbox", { name: "Education" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Name" })).toBeRequired();
  });

  it("shows the required message after a field was left", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole("textbox", { name: "Education" }));
    await user.click(screen.getByRole("textbox", { name: "Name" }));

    expect(await screen.findByText("Education is required")).toBeInTheDocument();
  });

  it("shows the general error only when the request failed", () => {
    renderWithProviders(<Harness failed />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
  });
});
