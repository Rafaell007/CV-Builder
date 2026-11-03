import { Transform } from "class-transformer";

/** Trims text input, so a name of only spaces counts as empty. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value));
