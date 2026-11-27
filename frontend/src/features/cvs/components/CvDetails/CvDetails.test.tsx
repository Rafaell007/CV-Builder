import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { backendCv, updateCvMock } from "../../cvForm.mocks";
import { cvCodeErrorMock, cvMock } from "../../useCv/cv.mocks";
import { renderWithProviders } from "@/shared/testing";
import { CvDetails } from "./CvDetails";

describe("CvDetails", () => {
  it("shows the form filled with the CV of the backend", async () => {
    renderWithProviders(<CvDetails cvId={backendCv.id} />, { mocks: [cvMock(backendCv)] });

    expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Backend CV");
    expect(screen.getByRole("textbox", { name: "Education" })).toHaveValue("MSc Computer Science");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Five years of Node.js",
    );
    expect(screen.getByRole("button", { name: "UPDATE" })).toBeDisabled();
  });

  it("saves a change with the UPDATE button", async () => {
    const input = {
      id: backendCv.id,
      name: "Backend CV 2",
      education: backendCv.education,
      description: backendCv.description,
    };
    const { user } = renderWithProviders(<CvDetails cvId={backendCv.id} />, {
      mocks: [cvMock(backendCv), updateCvMock(input)],
    });
    await user.type(await screen.findByRole("textbox", { name: "Name" }), " 2");

    await user.click(screen.getByRole("button", { name: "UPDATE" }));

    expect(await screen.findByText("CV updated")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV 2");
  });

  it("shows nothing when the CV did not load", async () => {
    renderWithProviders(<CvDetails cvId={backendCv.id} />, {
      mocks: [cvCodeErrorMock(backendCv.id, "NOT_FOUND")],
    });

    // The mock answers after a tick: wait for it, then check that no empty form appeared.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "UPDATE" })).not.toBeInTheDocument();
  });
});
