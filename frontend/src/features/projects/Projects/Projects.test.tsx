import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Projects } from "./Projects";
import { blog, projectsErrorMock, projectsMock, sales } from "./projects.mocks";

describe("Projects", () => {
  it("shows the title and a loading state while the projects load", () => {
    renderWithProviders(<Projects />, { mocks: [projectsMock([blog])] });

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading projects" })).toBeInTheDocument();
    // The structure of the list stays visible while loading.
    expect(screen.getByRole("table", { name: "Projects list" })).toBeInTheDocument();
  });

  it("shows the projects of the backend", async () => {
    renderWithProviders(<Projects />, { mocks: [projectsMock([blog, sales])] });

    expect(await screen.findByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Cloud Sales Management")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading projects" })).not.toBeInTheDocument();
  });

  it("shows No projects found when the backend has none", async () => {
    renderWithProviders(<Projects />, { mocks: [projectsMock([])] });

    expect(await screen.findByText("No projects found")).toBeInTheDocument();
  });

  it("shows an error with a retry button, not an empty list, when the request fails", async () => {
    renderWithProviders(<Projects />, { mocks: [projectsErrorMock()] });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.queryByText("No projects found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the projects after Retry succeeds", async () => {
    const { user } = renderWithProviders(<Projects />, {
      mocks: [projectsErrorMock(), projectsMock([blog])],
    });

    await user.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Blog")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the texts in Polish", async () => {
    renderWithProviders(<Projects />, { locale: "pl", mocks: [projectsMock([])] });

    expect(screen.getByRole("heading", { name: "Projekty" })).toBeInTheDocument();
    expect(await screen.findByText("Nie znaleziono projektów")).toBeInTheDocument();
  });
});
