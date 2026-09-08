import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const text = (max: number) => z.string().trim().max(max);
export const exerciseSchema = z.object({
  id: z.string().min(1).max(80),
  name: text(100).min(1),
  muscle: text(80).min(1),
  equipment: text(80).min(1),
  instructions: text(2000),
});
export const prescriptionSchema = z.object({
  exerciseId: z.string().min(1).max(80),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weight: z.number().min(0).max(1000),
  restSeconds: z.number().int().min(0).max(600),
  note: text(1000),
});
export const planSchema = z
  .object({
    title: text(140).min(1),
    description: text(2000),
    days: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          title: text(100).min(1),
          weekday: z.number().int().min(0).max(6),
          exercises: z.array(prescriptionSchema).min(1).max(30),
        }),
      )
      .min(1)
      .max(7),
  })
  .superRefine((plan, ctx) => {
    if (new Set(plan.days.map((d) => d.id)).size !== plan.days.length)
      ctx.addIssue({ code: "custom", message: "شناسه روزها باید یکتا باشد" });
    if (new Set(plan.days.map((d) => d.weekday)).size !== plan.days.length)
      ctx.addIssue({
        code: "custom",
        message: "برای هر روز هفته یک جلسه تعریف کنید",
      });
  });
export const planWriteSchema = z.object({
  mutationId: z.string().uuid(),
  expectedVersion: z.number().int().min(0),
  plan: planSchema,
});
export const assignmentSchema = z
  .object({
    planId: objectId,
    version: z.number().int().min(1),
    recipient: z.enum(["athlete", "class"]),
    recipientId: objectId,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    mutationId: z.string().uuid(),
  })
  .refine(
    (x) =>
      Date.parse(x.endsAt) > Date.parse(x.startsAt) &&
      Date.parse(x.endsAt) - Date.parse(x.startsAt) <= 366 * 86400000,
    "پایان باید بعد از شروع و بازه حداکثر یک سال باشد",
  );
export const setLogSchema = z.object({
  exerciseIndex: z.number().int().min(0).max(29),
  setIndex: z.number().int().min(0).max(19),
  reps: z.number().int().min(0).max(100),
  weight: z.number().min(0).max(1000),
  done: z.boolean(),
});
export const sessionWriteSchema = z
  .object({
    mutationId: z.string().uuid(),
    expectedRevision: z.number().int().min(0),
    assignmentId: objectId,
    dayId: z.string().min(1).max(80),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime().nullable(),
    status: z.enum(["active", "completed", "discarded"]),
    sets: z.array(setLogSchema).max(600),
    note: text(2000),
  })
  .superRefine((s, ctx) => {
    if (
      new Set(s.sets.map((x) => `${x.exerciseIndex}:${x.setIndex}`)).size !==
      s.sets.length
    )
      ctx.addIssue({ code: "custom", message: "ست تکراری است" });
    if (
      s.status === "active"
        ? s.finishedAt !== null
        : !s.finishedAt || Date.parse(s.finishedAt) < Date.parse(s.startedAt)
    )
      ctx.addIssue({ code: "custom", message: "زمان پایان تمرین معتبر نیست" });
    if (s.status === "completed" && !s.sets.some((x) => x.done))
      ctx.addIssue({ code: "custom", message: "حداقل یک ست را انجام دهید" });
  });
export type Plan = z.infer<typeof planSchema>;
export type SetLog = z.infer<typeof setLogSchema>;
export type SessionWrite = z.infer<typeof sessionWriteSchema>;
