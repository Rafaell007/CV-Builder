import { Transform } from "class-transformer";

/** Trims text input, so a value of only spaces counts as empty. Other types pass through. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value));
