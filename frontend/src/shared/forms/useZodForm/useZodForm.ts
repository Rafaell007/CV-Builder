"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";
import type { z } from "zod";

// TInput: the values the fields hold. TOutput: what the schema makes of them (e.g. trimmed strings).
export type UseZodFormOptions<TInput extends FieldValues, TOutput extends FieldValues> = Omit<
  UseFormProps<TInput, unknown, TOutput>,
  "resolver"
>;

/**
 * React Hook Form checked by a Zod schema. The submit handler gets the schema's output.
 * Default `mode: "onTouched"`: a field shows its error once it was left, then updates while the user types.
 * The schema carries translated messages, so build it in the form's hook (e.g. `createXSchema(t)` in `useMemo`).
 */
export function useZodForm<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>,
  options?: UseZodFormOptions<TInput, TOutput>,
) {
  return useForm<TInput, unknown, TOutput>({
    mode: "onTouched",
    ...options,
    resolver: zodResolver(schema),
  });
}
