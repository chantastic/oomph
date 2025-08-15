import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByAssignee = query({
  args: { assigneeId: v.id("assignees") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});

export const getAssignee = query({
  args: { assigneeId: v.id("assignees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assigneeId);
  },
});

export const create = mutation({
  args: {
    assigneeId: v.id("assignees"),
    title: v.string(),
    cronSchedule: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignments", {
      assigneeId: args.assigneeId,
      title: args.title,
      cronSchedule: args.cronSchedule,
    });
  },
}); 

export const getCompletionsForAssigneeBetween = query({
  args: {
    assigneeId: v.id("assignees"),
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Get assignments for the assignee
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();

    const assignmentIds = new Set(assignments.map((a) => a._id.toString()));

    // Query all completions and filter in-memory by time window and assignmentId.
    // This avoids using index range builders directly and is acceptable for small datasets.
    const allCompletions = await ctx.db.query("assignment_completions").collect();
    const filtered = allCompletions.filter(
      (c) =>
        c.completedAt >= args.startMs &&
        c.completedAt <= args.endMs &&
        assignmentIds.has(c.assignmentId.toString())
    );
    return filtered;
  },
});

export const createCompletion = mutation({
  args: {
    assignmentId: v.id("assignments"),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignment_completions", {
      assignmentId: args.assignmentId,
      completedAt: args.completedAt,
    });
  },
});

export const deleteCompletion = mutation({
  args: {
    assignmentId: v.id("assignments"),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Find completions that match the assignmentId and exact completedAt timestamp
    const matches = await ctx.db
      .query("assignment_completions")
      .withIndex("by_assignment_completedAt", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("completedAt", args.completedAt)
      )
      .collect();

    for (const m of matches) {
      await ctx.db.delete(m._id);
    }

    return { deleted: matches.length };
  },
});

export const deleteCompletionById = mutation({
  args: {
    completionId: v.id("assignment_completions"),
  },
  handler: async (ctx, args) => {
    // Delete the completion document by its id. Callers should ensure they
    // only delete completions they are authorized to remove.
    await ctx.db.delete(args.completionId);
    return { deleted: 1 };
  },
});