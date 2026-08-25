import { z } from "zod";
import { IssuePriority, IssueStatusKind } from "@prisma/client";

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(10_000).optional(),
  statusId: z.string().uuid().optional(),
  statusKind: z.nativeEnum(IssueStatusKind).optional(),
  priority: z.nativeEnum(IssuePriority).default(IssuePriority.NONE),
  estimate: z.number().int().min(0).max(100).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).nullable().optional(),
  statusId: z.string().uuid().optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  estimate: z.number().int().min(0).max(100).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const moveIssueSchema = z.object({
  targetStatusId: z.string().uuid(),
  previousIssueSortOrder: z.number().finite().optional(),
  nextIssueSortOrder: z.number().finite().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5_000),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type MoveIssueInput = z.infer<typeof moveIssueSchema>;
