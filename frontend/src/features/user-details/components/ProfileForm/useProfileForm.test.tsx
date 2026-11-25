import type { MockLink } from "@apollo/client/testing";
import { act, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { UpdateProfileInput } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import {
  updateProfileMock,
  updateProfileNetworkErrorMock,
  updateProfileRefusedMock,
} from "../../user-details.mocks";
import type { ProfileUser } from "../../user-details.types";
import { useProfileForm } from "./useProfileForm";

const emma: ProfileUser = {
  id: "7",
  firstName: "Emma",
  lastName: "Employee",
  department: { __typename: "Department", id: "d1", name: "React" },
  position: { __typename: "Position", id: "p1", name: "Software Engineer" },
};

// What the form sends after the test typed " Emily " and chose Java: the rules trim the name.
const renamed: UpdateProfileInput = {
  id: "7",
  firstName: "Emily",
  lastName: "Employee",
  departmentId: "d3",
  positionId: "p1",
};

// renderWithProviders renders elements; this small component runs the hook inside the same providers (Apollo, toast).
// It renders no fields, so `formState` is not watched: errors are read with `getFieldState`.
function setup(mocks: MockLink.MockedResponse[] = []) {
  let current!: ReturnType<typeof useProfileForm>;
  function Probe(): ReactNode {
    current = useProfileForm(emma);
    return null;
  }
  renderWithProviders(<Probe />, { mocks });
  return {
    result: () => current,
    /** Types a new first name (with spaces around it) and chooses another department, as a user would. */
    edit: () =>
      act(() => {
        current.form.setValue("firstName", " Emily ", { shouldDirty: true });
        current.form.setValue("departmentId", "d3", { shouldDirty: true });
      }),
    submit: () => act(() => current.submit()),
  };
}

describe("useProfileForm", () => {
  it("starts with the user's values and nothing changed", () => {
    const { result } = setup();

    expect(result().form.getValues()).toEqual({
      firstName: "Emma",
      lastName: "Employee",
      departmentId: "d1",
      positionId: "p1",
    });
    expect(result().hasChanged).toBe(false);
  });

  it("counts a real change, but not spaces around a name", async () => {
    const { result } = setup();

    await act(() => result().form.setValue("lastName", "Employee "));
    expect(result().hasChanged).toBe(false);

    await act(() => result().form.setValue("lastName", "Engineer"));
    expect(result().hasChanged).toBe(true);
  });

  it("saves the trimmed values, shows a toast and makes them the unchanged state", async () => {
    const { result, edit, submit } = setup([updateProfileMock(renamed)]);
    await edit();
    expect(result().hasChanged).toBe(true);

    await submit();

    expect(await screen.findByText("Profile updated")).toBeInTheDocument();
    expect(screen.getByText("Emily Employee's profile was saved.")).toBeInTheDocument();
    expect(result().form.getValues("firstName")).toBe("Emily");
    expect(result().hasChanged).toBe(false);
    expect(result().generalError).toBeNull();
  });

  it("sends nothing while a rule fails", async () => {
    // No mock: a request would fail and show the general error.
    const { result, submit } = setup();
    await act(() => result().form.setValue("firstName", "   "));

    await submit();

    expect(result().form.getFieldState("firstName").error?.message).toBe("First name is required");
    expect(result().generalError).toBeNull();
  });

  it("sends one request when UPDATE is pressed twice at once", async () => {
    // One mock only: a second request would find none and show the general error.
    const { result, edit } = setup([updateProfileMock(renamed)]);
    await edit();

    await act(() => Promise.all([result().submit(), result().submit()]));

    expect(await screen.findByText("Profile updated")).toBeInTheDocument();
    expect(result().generalError).toBeNull();
  });

  it("shows a backend field error under its field and keeps the typed values", async () => {
    const { result, edit, submit } = setup([
      updateProfileRefusedMock(renamed, {
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "departmentId", messages: ["Department not found"] }],
      }),
    ]);
    await edit();

    await submit();

    expect(result().form.getFieldState("departmentId").error?.message).toBe("Check this field");
    expect(result().generalError).toBeNull();
    expect(result().form.getValues("departmentId")).toBe("d3");
  });

  it.each([
    [{ code: "FORBIDDEN" }, "forbidden"],
    [{ code: "NOT_FOUND" }, "notFound"],
    [{ code: "CONFLICT", reason: "CONCURRENT_CHANGE" }, "concurrentChange"],
    [{ code: "BAD_USER_INPUT", fieldErrors: [{ field: "role", messages: ["x"] }] }, "failed"],
  ])(
    "shows %o as the general error %s and keeps the typed values",
    async (extensions, expected) => {
      const { result, edit, submit } = setup([updateProfileRefusedMock(renamed, extensions)]);
      await edit();

      await submit();

      expect(result().generalError).toBe(expected);
      expect(result().form.getValues("firstName")).toBe(" Emily ");
      expect(result().hasChanged).toBe(true);
    },
  );

  it("shows the general error when the network fails", async () => {
    const { result, edit, submit } = setup([updateProfileNetworkErrorMock(renamed)]);
    await edit();

    await submit();

    expect(result().generalError).toBe("failed");
  });
});
