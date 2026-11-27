import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { FormErrorMessage } from "./FormErrorMessage";

describe("FormErrorMessage", () => {
  it("shows the text as an alert, so a screen reader reads it at once", () => {
    renderWithProviders(<FormErrorMessage>Something went wrong</FormErrorMessage>);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
