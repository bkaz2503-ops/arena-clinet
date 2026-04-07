import { z } from "zod";

import { normalizePin } from "@/lib/pin";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const createEventSchema = z.object({
  title: z.string().min(3).max(120),
  specialty: z.string().min(2).max(80)
});

export const joinEventSchema = z.object({
  pin: z.string().min(4).max(10).transform(normalizePin),
  display_name: z.string().min(2).max(40)
});

export const createQuestionSchema = z.object({
  statement: z.string().min(10).max(500),
  explanation: z.string().max(1000).optional().default(""),
  time_limit_seconds: z.number().int().min(5).max(300),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(5),
        text: z.string().min(1).max(280),
        is_correct: z.boolean()
      })
    )
    .min(2)
    .max(6)
    .refine(
      (options) =>
        options.filter((option) => option.is_correct).length === 1,
      {
        message: "Exactly one option must be correct."
      }
    )
});

export const updateQuestionSchema = createQuestionSchema
  .extend({
    order_index: z.number().int().min(0).optional()
  })
  .partial();

export function isZodValidationError(error: unknown) {
  return error instanceof z.ZodError;
}

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export const answerSchema = z.object({
  participant_id: z.string().cuid(),
  question_id: z.string().cuid(),
  option_id: z.string().cuid(),
  response_time_ms: z.number().int().min(0).max(3_600_000)
});
