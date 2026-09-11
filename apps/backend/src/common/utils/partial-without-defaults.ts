import { z } from "zod";

/** PATCH must preserve omitted fields; Zod 4 partial() retains create defaults. */
export function partialWithoutDefaults<T extends z.ZodRawShape>(shape: T) {
  const fields = Object.fromEntries(
    Object.entries(shape).map(([key, field]) => [
      key,
      z.optional(field instanceof z.ZodDefault ? field.removeDefault() : field),
    ]),
  ) as { [K in keyof T]: z.ZodOptional<T[K]> };
  return z.object(fields);
}
