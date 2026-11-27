import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { frontendCv } from "../../cvs.mocks";
import { cvCodeErrorMock, cvMock, cvNetworkErrorMock } from "../../useCv/cv.mocks";
import { CvLayout } from "./CvLayout";

const route = vi.hoisted(() => ({ pathname: "/cvs/1/details", search: "" }));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => new URLSearchParams(route.search),
}));

vi.mock("@/shared/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n")>()),
  usePathname: () => route.pathname,
}));

function setup(options: RenderWithProvidersOptions) {
  return renderWithProviders(
    <CvLayout cvId={frontendCv.id}>
      <p>Tab page</p>
    </CvLayout>,
    options,
  );
}

const breadcrumbs = () => screen.getByRole("navigation", { name: "Breadcrumbs" });

describe("CvLayout", () => {
  beforeEach(() => {
    route.pathname = "/cvs/1/details";
    route.search = "";
  });

  it("shows the loading state and the tabs while the CV loads", () => {
    setup({ mocks: [cvMock(frontendCv)] });

    expect(screen.getByRole("status", { name: "Loading CV" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "CV sections" })).toBeInTheDocument();
    expect(screen.queryByText("Tab page")).not.toBeInTheDocument();
  });

  it("shows the page and the breadcrumbs CVs, the CV name and the tab", async () => {
    setup({ mocks: [cvMock(frontendCv)] });

    expect(await screen.findByText("Tab page")).toBeInTheDocument();
    const items = within(breadcrumbs()).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["CVs", "Frontend Developer", "Details"]);
    expect(within(breadcrumbs()).getByText("Details")).toHaveAttribute("aria-current", "page");
  });

  it("links CVs in the breadcrumbs back to the CVs page", async () => {
    setup({ mocks: [cvMock(frontendCv)] });
    await screen.findByText("Tab page");

    expect(within(breadcrumbs()).getByRole("link", { name: "CVs" })).toHaveAttribute(
      "href",
      "/en/cvs",
    );
  });

  it("shows the four tabs with links to the routes of the CV and marks Details", async () => {
    setup({ mocks: [cvMock(frontendCv)] });
    await screen.findByText("Tab page");

    const tabs = within(screen.getByRole("navigation", { name: "CV sections" }));
    expect(tabs.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Details",
      "Skills",
      "Projects",
      "Preview",
    ]);
    expect(tabs.getByRole("link", { name: "Skills" })).toHaveAttribute("href", "/en/cvs/1/skills");
    expect(tabs.getByRole("link", { name: "Details" })).toHaveAttribute("aria-current", "page");
  });

  describe("a CV opened from the User CVs tab (from in the address)", () => {
    const from = "%2Fusers%2F10%2Fcvs";

    it("leads the CVs breadcrumb back to that tab and keeps it in the links of the tabs", async () => {
      route.pathname = "/cvs/1/preview";
      route.search = `from=${from}`;
      // The mock answers only when the request carries the employee of the tab as userId (AC-12).
      setup({ mocks: [cvMock(frontendCv, "10")] });
      await screen.findByText("Tab page");

      expect(within(breadcrumbs()).getByRole("link", { name: "CVs" })).toHaveAttribute(
        "href",
        "/en/users/10/cvs",
      );
      const tabs = within(screen.getByRole("navigation", { name: "CV sections" }));
      expect(tabs.getByRole("link", { name: "Skills" })).toHaveAttribute(
        "href",
        `/en/cvs/1/skills?from=${from}`,
      );
      // The active tab is still found, although the links have a query.
      expect(tabs.getByRole("link", { name: "Preview" })).toHaveAttribute("aria-current", "page");
      expect(within(breadcrumbs()).getByText("Preview")).toHaveAttribute("aria-current", "page");
    });

    it.each([
      ["another site", "https%3A%2F%2Fevil.example%2Fusers%2F10%2Fcvs"],
      ["another page", "%2Fskills"],
      ["a path with extra parts", "%2Fusers%2F10%2Fcvs%2Fextra"],
    ])("ignores %s and leads back to the CVs page", async (_name, value) => {
      route.search = `from=${value}`;
      setup({ mocks: [cvMock(frontendCv)] });
      await screen.findByText("Tab page");

      expect(within(breadcrumbs()).getByRole("link", { name: "CVs" })).toHaveAttribute(
        "href",
        "/en/cvs",
      );
      const tabs = within(screen.getByRole("navigation", { name: "CV sections" }));
      expect(tabs.getByRole("link", { name: "Skills" })).toHaveAttribute(
        "href",
        "/en/cvs/1/skills",
      );
    });
  });

  it("marks the tab of the route and names it in the breadcrumbs", async () => {
    route.pathname = "/cvs/1/projects";
    setup({ mocks: [cvMock(frontendCv)] });
    await screen.findByText("Tab page");

    const tabs = within(screen.getByRole("navigation", { name: "CV sections" }));
    expect(tabs.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(tabs.getByRole("link", { name: "Details" })).not.toHaveAttribute("aria-current");
    expect(within(breadcrumbs()).getByText("Projects")).toHaveAttribute("aria-current", "page");
  });

  it("shows CV not found, without the page, the tabs and the CV name, when the backend answers NOT_FOUND", async () => {
    setup({ mocks: [cvCodeErrorMock(frontendCv.id, "NOT_FOUND")] });

    expect(await screen.findByRole("alert")).toHaveTextContent("CV not found");
    expect(screen.getByRole("link", { name: "Back to CVs" })).toHaveAttribute("href", "/en/cvs");
    expect(screen.queryByText("Tab page")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "CV sections" })).not.toBeInTheDocument();
    expect(within(breadcrumbs()).queryByText("Frontend Developer")).not.toBeInTheDocument();
  });

  it("shows No access, without the page, when the backend answers FORBIDDEN", async () => {
    setup({ mocks: [cvCodeErrorMock(frontendCv.id, "FORBIDDEN")] });

    expect(await screen.findByRole("alert")).toHaveTextContent("No access");
    expect(screen.queryByText("Tab page")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "CV sections" })).not.toBeInTheDocument();
  });

  it("shows the error with Retry for a network error, and Retry loads the CV again", async () => {
    const { user } = setup({
      mocks: [cvNetworkErrorMock(frontendCv.id), cvMock(frontendCv)],
    });
    expect(await screen.findByText("Failed to load CV details")).toBeInTheDocument();
    expect(screen.queryByText("Tab page")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Tab page")).toBeInTheDocument();
  });
});
