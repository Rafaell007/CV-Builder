import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { MoreVertIcon } from "./icons";
import { PasswordField } from "./PasswordField";
import { SearchField } from "./SearchField";
import { Textarea } from "./Textarea";
import { TextField } from "./TextField";

// The KAN-77 demo page: every form control together, as the auth and catalog pages will use them.
// Switch theme and language in the toolbar; each component has its own stories with every state.
function FormControlsOverview() {
  return (
    <div style={{ display: "grid", gap: "var(--space-8)", maxWidth: 400 }}>
      <SearchField label="Search employees" placeholder="Search" onSearch={fn()} />
      <form
        style={{ display: "grid", gap: "var(--space-8)" }}
        onSubmit={(event) => event.preventDefault()}
      >
        <TextField label="Email" type="email" autoComplete="email" />
        <PasswordField
          label="Password"
          showPasswordLabel="Show password"
          hidePasswordLabel="Hide password"
          error="Password must be at least 6 characters long"
        />
        <Textarea label="Description" helperText="Shown on the CV" />
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          <Button type="submit">Sign in</Button>
          <Button variant="ghost">Forgot password</Button>
          <IconButton aria-label="More actions">
            <MoreVertIcon />
          </IconButton>
        </div>
      </form>
    </div>
  );
}

const meta = {
  title: "Form controls/Overview",
  component: FormControlsOverview,
  // The page is a composition, not a component with props: no docs page.
  tags: ["!autodocs"],
} satisfies Meta<typeof FormControlsOverview>;

export default meta;

type Story = StoryObj<typeof meta>;

// Keyboard check: Tab walks search → email → password → eye → description → buttons, in visual order.
export const Overview: Story = {
  play: async ({ canvas, userEvent }) => {
    const order = [
      canvas.getByRole("searchbox", { name: "Search employees" }),
      canvas.getByRole("textbox", { name: "Email" }),
      canvas.getByLabelText("Password"),
      canvas.getByRole("button", { name: "Show password" }),
      canvas.getByRole("textbox", { name: "Description" }),
      canvas.getByRole("button", { name: "Sign in" }),
      canvas.getByRole("button", { name: "Forgot password" }),
      canvas.getByRole("button", { name: "More actions" }),
    ];
    for (const element of order) {
      await userEvent.tab();
      await expect(element).toHaveFocus();
    }
  },
};

export const OverviewDark: Story = { globals: { theme: "dark" } };
