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