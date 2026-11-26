import { act, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import {
  departmentOptionsMock,
  meMock,
  positionOptionsMock,
  userMock,
} from "../../user-details.mocks";
import { UserProfile } from "./UserProfile";

// VERIFY EMAIL in the form reads the router; the page has the App Router, this test does not.
vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push: vi.fn(), replace: vi.fn() }),
  ),
);

const PHOTO = "/api/users/10/avatar?v=1";

/** The same `user` answer, with a photo. */
const withAvatar = (
  mock: ReturnType<typeof userMock>,
  avatarUrl: string,
): ReturnType<typeof userMock> => {
  const data = mock.result as { data: { user: Record<string, unknown> } };
  return { ...mock, result: { data: { user: { ...data.data.user, avatarUrl } } } };
};

// The tab reads `me`, `user(id)` and the form options with useSuspenseQuery; on the page the route preloads them on
// the server. React 19 shows a suspended tree only inside an awaited act(); without it the fallback never leaves.
// The signed-in user of `meMock` has id "1"; the page shows user "10".
const setup = async (
  user = userMock("10"),
  locale: "en" | "pl" = "en",
  role: "ADMIN" | "USER" = "USER",
) => {
  await act(async () => {
    renderWithProviders(
      <Suspense fallback={<p>Suspended</p>}>
        <UserProfile userId="10" />
      </Suspense>,
      { mocks: [meMock(role), user, departmentOptionsMock(), positionOptionsMock()], locale },
    );
  });
};

describe("UserProfile", () => {
  it("shows the initials, the name, the email and the day the user joined", async () => {
    await setup();

    const profile = await screen.findByRole("region", { name: "Emma Employee" });
    expect(profile).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Emma Employee" })).toHaveTextContent("EE");
    expect(screen.getByRole("heading", { level: 2, name: "Emma Employee" })).toBeInTheDocument();
    expect(screen.getByText("emma@example.com")).toBeInTheDocument();
    expect(screen.getByText("A member since Sun, Jan 14, 2024")).toBeInTheDocument();
  });

  it("names a user without a name by the email and does not repeat it", async () => {
    await setup(userMock("10", { firstName: null, lastName: null }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "emma@example.com" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("emma@example.com")).toHaveLength(1);
  });

  it("writes the day in the language of the page", async () => {
    await setup(userMock("10"), "pl");

    expect(await screen.findByText("Członek od niedz., 14 sty 2024")).toBeInTheDocument();
  });

  it("shows another employee's profile read-only", async () => {
    await setup();

    expect(await screen.findByRole("textbox", { name: /First Name/ })).toHaveAttribute("readonly");
  });

  it("lets an Admin edit any profile", async () => {
    await setup(userMock("10"), "en", "ADMIN");

    expect(await screen.findByRole("textbox", { name: /First Name/ })).not.toHaveAttribute(
      "readonly",
    );
  });

  it("offers VERIFY EMAIL on the owner's own profile while the email is not verified", async () => {
    // The signed-in user "1" opens their own profile.
    await act(async () => {
      renderWithProviders(
        <Suspense fallback={<p>Suspended</p>}>
          <UserProfile userId="1" />
        </Suspense>,
        {
          mocks: [
            meMock("USER", false),
            userMock("1"),
            departmentOptionsMock(),
            positionOptionsMock(),
          ],
        },
      );
    });

    expect(await screen.findByRole("button", { name: "Verify email" })).toBeInTheDocument();
  });

  it("knows the owner when the URL has the id in upper case", async () => {
    // The backend accepts a UUID in any letter case and answers it lower case, as `me.id` is.
    const id = "6f1d2c3b-0000-4000-8000-00000000000a";
    const urlId = id.toUpperCase();
    const user = userMock(id);
    await act(async () => {
      renderWithProviders(
        <Suspense fallback={<p>Suspended</p>}>
          <UserProfile userId={urlId} />
        </Suspense>,
        {
          mocks: [
            meMock("USER", false, id),
            { ...user, request: { ...user.request, variables: { id: urlId } } },
            departmentOptionsMock(),
            positionOptionsMock(),
          ],
        },
      );
    });

    expect(await screen.findByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify email" })).toBeInTheDocument();
  });

  it("shows the photo and lets an Admin upload or remove it", async () => {
    await setup(withAvatar(userMock("10"), PHOTO), "en", "ADMIN");

    const avatar = await screen.findByRole("img", { name: "Emma Employee" });
    expect(avatar.querySelector("img")).toHaveAttribute("src", PHOTO);
    expect(screen.getByLabelText("Upload avatar image")).toHaveAccessibleDescription(
      "png, jpg or gif no more than 5MB",
    );
    expect(screen.getByRole("button", { name: "Remove avatar" })).toBeInTheDocument();
  });

  it("offers upload but no Remove when there is no photo", async () => {
    await setup(userMock("10"), "en", "ADMIN");

    expect(await screen.findByLabelText("Upload avatar image")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove avatar" })).not.toBeInTheDocument();
  });

  it("shows another employee's photo with no upload and no Remove", async () => {
    await setup(withAvatar(userMock("10"), PHOTO));

    const avatar = await screen.findByRole("img", { name: "Emma Employee" });
    expect(avatar.querySelector("img")).toHaveAttribute("src", PHOTO);
    expect(screen.queryByLabelText("Upload avatar image")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove avatar" })).not.toBeInTheDocument();
  });

  it("writes the avatar texts in the language of the page", async () => {
    await setup(withAvatar(userMock("10"), PHOTO), "pl", "ADMIN");

    expect(await screen.findByLabelText("Prześlij zdjęcie awatara")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuń awatar" })).toBeInTheDocument();
  });

  it("offers no VERIFY EMAIL to an Admin on another employee's profile", async () => {
    // meMock's Admin is verified; the point is that the button belongs to the owner only.
    await setup(userMock("10"), "en", "ADMIN");

    expect(await screen.findByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
  });
});
