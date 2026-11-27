import { Transform } from "class-transformer";

/**
 * For unique names: trims text input and turns every run of whitespace inside it into one space,
 * so "Human  Resources" and "Human Resources" are the same name. Other types pass through.
 */
export const NormalizeSpaces = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  );
