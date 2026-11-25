import type { MockLink } from "@apollo/client/testing";
import { act, screen } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateProfileInput } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import {
  departmentOptionsErrorMock,
  departmentOptionsMock,
  positionOptionsMock,
  resendCodeMock,
  updateProfileMock,
  updateProfileNetworkErrorMock,
} from "../../user-details.mocks";
import type { ProfileUser } from "../../user-details.types";
import { ProfileForm } from "./ProfileForm";

// VERIFY EMAIL opens the Email Verification page with the router.
const push = vi.fn();
vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push, replace: vi.fn() }),
  ),
);

beforeEach(() => push.mockClear());

const emma: ProfileUser = {
  id: "7",
  firstName: "Emma",
  lastName: "Employee",
  department: { __typename: "Department", id: "d1", name: "React" },
  position: { __typename: "Position", id: "p1", name: "Software Engineer" },
};

const unassigned: ProfileUser = { ...emma, department: null, position: null };

const loadedOptions = () => [departmentOptionsMock(), positionOptionsMock()];

// On the page the route preloads the options on the server; here the mocks answer them. The form reads them with
// useSuspenseQuery, and React 19 shows a suspended tree only inside an awaited act().
async function setup({
  user = emma,
  canEdit = true,
  canVerifyEmail = false,
  mocks = loadedOptions(),
}: {
  user?: ProfileUser;
  canEdit?: boolean;
  canVerifyEmail?: boolean;
  mocks?: MockLink.MockedResponse[];
} = {}) {
  let rendered!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    rendered = renderWithProviders(
      <Suspense fallback={<p>Suspended</p>}>
        <ProfileForm user={user} canEdit={canEdit} canVerifyEmail={canVerifyEmail} />
      </Suspense>,
      { mocks },
    );
  });
  await screen.findByRole("textbox", { name: /First Name/ });
  return rendered;
}

const firstName = () => screen.getByRole("textbox", { name: /First Name/ });
const lastName = () => screen.getByRole("textbox", { name: /Last Name/ });
const department = () => screen.getByRole("combobox", { name: /Department/ });
const position = () => screen.getByRole("combobox", { name: /Position/ });
const updateButton = () => screen.getByRole("button", { name: "Update" });

// What UPDATE sends after the tests typed "Emily" as the first name.
const renamed: UpdateProfileInput = {
  id: "7",
  firstName: "Emily",
  lastName: "Employee",
  departmentId: "d1",
  positionId: "p1",
};

describe("ProfileForm", () => {
  it("shows the user's values in the four fields", async () => {
    await setup();

    expect(firstName()).toHaveValue("Emma");
    expect(lastName()).toHaveValue("Employee");
    expect(department()).toHaveTextContent("React");
    expect(position()).toHaveTextContent("Software Engineer");
  });

  it("lets the owner or an Admin change the values", async () => {
    const { user } = await setup();

    await user.clear(firstName());
    await user.type(firstName(), "Emily");
    await user.click(department());
    await user.click(screen.getByRole("option", { name: "Java" }));

    expect(firstName()).toHaveValue("Emily");
    expect(department()).toHaveTextContent("Java");
  });

  it("shows the rules when a name is left empty", async () => {
    const { user } = await setup();

    await user.clear(lastName());
    await user.tab();

    expect(await screen.findByText("Last name is required")).toBeInTheDocument();
  });

  it("asks for a department and a position the user does not have yet", async () => {
    const { user } = await setup({ user: unassigned });

    await user.click(department());
    await user.keyboard("{Escape}");
    await user.tab();

    expect(await screen.findByText("Department is required")).toBeInTheDocument();
  });

  it("shows another employee's profile read-only, but still reachable by keyboard", async () => {
    const { user } = await setup({ canEdit: false });

    for (const field of [firstName(), lastName()]) {
      expect(field).toHaveAttribute("readonly");
      expect(field).not.toBeRequired();
    }
    for (const field of [department(), position()]) {
      expect(field).toHaveAttribute("aria-readonly", "true");
      expect(field).toBeEnabled();
    }

    await user.type(firstName(), "x");
    expect(firstName()).toHaveValue("Emma");
    await user.tab();
    expect(lastName()).toHaveFocus();

    await user.click(department());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps the current department and offers Retry when the departments failed to load", async () => {
    await setup({ mocks: [departmentOptionsErrorMock(), positionOptionsMock()] });

    expect(department()).toHaveTextContent("React");
    expect(screen.getByText("Failed to load departments")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("keeps UPDATE disabled until a value really changes", async () => {
    const { user } = await setup();
    expect(updateButton()).toBeDisabled();

    await user.type(lastName(), " ");
    expect(updateButton()).toBeDisabled();

    await user.type(lastName(), "s");
    expect(updateButton()).toBeEnabled();
  });

  it("saves the changes with UPDATE, shows a toast and disables UPDATE again", async () => {
    const { user } = await setup({ mocks: [...loadedOptions(), updateProfileMock(renamed)] });

    await user.clear(firstName());
    await user.type(firstName(), "Emily");
    await user.click(updateButton());

    expect(await screen.findByText("Profile updated")).toBeInTheDocument();
    expect(firstName()).toHaveValue("Emily");
    expect(updateButton()).toBeDisabled();
  });

  it("shows a general error above UPDATE when the save fails, and keeps the typed values", async () => {
    const { user } = await setup({
      mocks: [...loadedOptions(), updateProfileNetworkErrorMock(renamed)],
    });

    await user.clear(firstName());
    await user.type(firstName(), "Emily");
    await user.click(updateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Try again.");
    expect(firstName()).toHaveValue("Emily");
    expect(updateButton()).toBeEnabled();
  });

  it("shows no UPDATE on a read-only profile", async () => {
    await setup({ canEdit: false });

    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
  });

  it("shows VERIFY EMAIL left of UPDATE when the owner's email is not verified", async () => {
    await setup({ canVerifyEmail: true });

    const verify = screen.getByRole("button", { name: "Verify email" });
    expect(verify).toHaveAttribute("type", "button");
    // Same row, VERIFY EMAIL first (Figma: 24px left of UPDATE).
    expect(verify.nextElementSibling).toBe(updateButton());
  });

  it("sends a code with VERIFY EMAIL and opens the Email Verification page, without saving", async () => {
    // No updateProfile mock: a save would fail and show the general error.
    const { user } = await setup({
      canVerifyEmail: true,
      mocks: [...loadedOptions(), resendCodeMock()],
    });

    await user.click(screen.getByRole("button", { name: "Verify email" }));

    expect(await screen.findByText("Verification email has been sent")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/verify-email");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows no VERIFY EMAIL when it is not offered", async () => {
    await setup();

    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
  });

  it("shows no load error on a read-only profile", async () => {
    await setup({ canEdit: false, mocks: [departmentOptionsErrorMock(), positionOptionsMock()] });

    expect(department()).toHaveTextContent("React");
    expect(screen.queryByText("Failed to load departments")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
