import { z } from "zod";
import { SprintState } from "@prisma/client";

export const createSprintSchema = z.object({
  name: z.string().min(1, "Sprint name is required").max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().max(500).nullable().optional(),
  state: z.nativeEnum(SprintState).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const completeSprintSchema = z.object({
  incompleteAction: z.enum(["backlog", "next_sprint"]).default("backlog"),
  nextSprintId: z.string().uuid().optional(),
});

export const assignSprintIssueSchema = z.object({
  issueId: z.string().uuid(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type CompleteSprintInput = z.infer<typeof completeSprintSchema>;
