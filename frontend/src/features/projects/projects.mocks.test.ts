import type { MockLink } from "@apollo/client/testing";
import { describe, expect, it } from "vitest";
import type { ProjectsQuery, ProjectsQueryVariables } from "@/shared/graphql";
import { analytics, banking, blog, fakeBackendMock, manyProjects, sales } from "./projects.mocks";

// The stand-in backend of the stories: its rules must match the real backend, or a story shows wrong behaviour.
const ask = (all: Parameters<typeof fakeBackendMock>[0], variables: ProjectsQueryVariables) => {
  const { result } = fakeBackendMock(all);
  const response = (
    result as MockLink.ResultFunction<{ data: ProjectsQuery }, ProjectsQueryVariables>
  )(variables) as { data: ProjectsQuery };
  return response.data.projects;
};
const page = { number: 1, size: 10 };
const all = [banking, blog, sales, analytics];

describe("fakeBackendMock", () => {
  it("returns every project sorted by name when there is no search and no sort", () => {
    const { items, total } = ask(all, { page });

    expect(items.map((project) => project.name)).toEqual([
      "Blog",
      "Cloud Sales Management",
      "Logistics Analytics Dashboard",
      "Mobile Banking Platform",
    ]);
    expect(total).toBe(4);
  });

  it("searches name and domain without regard to case", () => {
    expect(ask(all, { page, search: "BANK" }).items).toEqual([banking]);
    expect(ask(all, { page, search: "logistics" }).items).toEqual([analytics]);
    expect(ask(all, { page, search: "zzz" })).toMatchObject({ items: [], total: 0 });
  });

  it("sorts by a date in both directions", () => {
    const ascending = ask(all, { page, sort: { field: "startDate", direction: "ASC" } });
    const descending = ask(all, { page, sort: { field: "startDate", direction: "DESC" } });

    expect(ascending.items[0]).toEqual(banking);
    expect(descending.items[0]).toEqual(blog);
  });

  it("cuts the pages and reports the total of all pages", () => {
    const projects = manyProjects(25);

    const third = ask(projects, { page: { number: 3, size: 10 } });

    expect(third.items).toHaveLength(5);
    expect(third.total).toBe(25);
  });
});
