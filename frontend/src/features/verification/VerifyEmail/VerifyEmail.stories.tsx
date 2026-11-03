import type { MockLink } from "@apollo/client/testing";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { MeDocument, ResendVerificationCodeDocument, VerifyEmailDocument } from "@/shared/graphql";
import { VerifyEmail } from "./VerifyEmail";

const unverifiedUser: MockLink.MockedResponse = {
  request: { query: MeDocument },
  result: {
    data: {
      me: {
        __typename: "SessionUser",
        id: "1",
        email: "new.user@example.com",
        firstName: null,
        lastName: null,
        role: "USER",
        isVerified: false,
      },
    },
  },
};

function failure(reason: string) {
  return { errors: [{ message: "x", extensions: { reason } }] };
}

const meta = {
  title: "Features/Verification/VerifyEmail",
  component: VerifyEmail,
  parameters: {
    layout: "fullscreen",
    // useRouter comes from next/navigation (App Router).
    nextjs: { appDirectory: true },
    apollo: { mocks: [unverifiedUser] },
  },
} satisfies Meta<typeof VerifyEmail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = { globals: { theme: "light" } };

export const Dark: Story = { globals: { theme: "dark" } };

export const MissingCode: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "CONFIRM" }));

    await expect(await canvas.findByText("Verification code is required")).toBeVisible();
  },
};

// The typed code stays in the field after the backend refuses it (AC-21).
export const ExpiredCode: Story = {
  parameters: {
    apollo: {
      mocks: [
        unverifiedUser,
        {
          request: { query: VerifyEmailDocument, variables: { input: { code: "123456" } } },
          result: failure("CODE_EXPIRED"),
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    const field = canvas.getByLabelText("Verification code");
    await userEvent.type(field, "123456");
    await userEvent.click(canvas.getByRole("button", { name: "CONFIRM" }));

    await expect(await canvas.findByText("Verification code has expired")).toBeVisible();
    await expect(field).toHaveValue("123456");
  },
};

// The backend allows one new code per minute; its refusal starts the timer on the button.
export const ResendTooSoon: Story = {
  parameters: {
    apollo: {
      mocks: [
        unverifiedUser,
        {
          request: { query: ResendVerificationCodeDocument },
          result: failure("RESEND_COOLDOWN"),
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "RESEND CODE" }));

    await expect(
      await canvas.findByText("Please wait before requesting another code"),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "RESEND CODE (60s)" })).toBeDisabled();
  },
};
