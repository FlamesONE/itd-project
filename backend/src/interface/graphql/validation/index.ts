import { GraphQLError } from "graphql";
import { z } from "zod";

export * from "./schemas";

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    throw new GraphQLError(`Validation error: ${errors.join(", ")}`, {
      extensions: { code: "VALIDATION_ERROR", errors: result.error.errors },
    });
  }

  return result.data;
}
