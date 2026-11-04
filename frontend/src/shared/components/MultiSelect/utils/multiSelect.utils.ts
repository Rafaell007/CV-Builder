import type { SelectOption } from "../../Select";

// Adds the value at the end, or removes it when it is already chosen (a checkbox row was clicked).
export function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

// The chosen options in the order they were chosen (the chips' order). Unknown values are skipped.
export function getSelectedOptions(
  options: readonly SelectOption[],
  values: readonly string[],
): SelectOption[] {
  return values.flatMap((value) => options.find((option) => option.value === value) ?? []);
}
