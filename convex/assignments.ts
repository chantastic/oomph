import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByAssignee = query({
  args: { assigneeId: v.id("assignees") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignee_assignments")
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
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignee_assignments", {
      assigneeId: args.assigneeId,
      title: args.title,
      cronSchedule: args.cronSchedule,
      description: args.description,
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
    // Get regular assignments for the assignee
    const regularAssignments = await ctx.db
      .query("assignee_assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();

    // Get JIT assignments for the assignee
    const jitAssignments = await ctx.db
      .query("assignee_jit_assignment")
      .withIndex("by_assignee_date", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();

    const regularAssignmentIds = new Set(regularAssignments.map((a) => a._id.toString()));
    const jitAssignmentIds = new Set(jitAssignments.map((a) => a._id.toString()));

    // Query completions in the time window using the `by_time` index,
    // then filter by assignmentId in-memory. This avoids fetching all
    // completions and is efficient when the time window is selective.
    const completionsInWindow = await ctx.db
      .query("assignment_completions")
      .withIndex("by_time", (q) =>
        q.gte("time", args.startMs).lte("time", args.endMs)
      )
      .collect();

    const filtered = completionsInWindow.filter((c) => {
      if (c.assignmentType === "cron") {
        return regularAssignmentIds.has(c.assignmentId);
      } else if (c.assignmentType === "jit") {
        return jitAssignmentIds.has(c.assignmentId);
      }
      return false;
    });

    return filtered;
  },
});

export const createCompletion = mutation({
  args: {
    assignmentId: v.string(),
    assignmentType: v.union(v.literal("cron"), v.literal("jit")),
    time: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignment_completions", {
      assignmentId: args.assignmentId,
      assignmentType: args.assignmentType,
      time: args.time,
    });
  },
});

export const deleteCompletion = mutation({
  args: {
    assignmentId: v.string(),
    assignmentType: v.union(v.literal("cron"), v.literal("jit")),
    time: v.number(),
  },
  handler: async (ctx, args) => {
    // Find completions that match the assignmentId and exact time timestamp
    const matches = await ctx.db
      .query("assignment_completions")
      .withIndex("by_assignment_time", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("time", args.time)
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

// JIT (Just in Time) assignment mutations and queries
export const createJitAssignment = mutation({
  args: {
    assigneeId: v.id("assignees"),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignee_jit_assignment", {
      assigneeId: args.assigneeId,
      title: args.title,
      description: args.description,
      date: args.date,
    });
  },
});

export const getJitAssignmentsForAssigneeOnDate = query({
  args: {
    assigneeId: v.id("assignees"),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignee_jit_assignment")
      .withIndex("by_assignee_date", (q) => 
        q.eq("assigneeId", args.assigneeId).eq("date", args.date)
      )
      .collect();
  },
});

export const getJitAssignmentsForAssigneeBetween = query({
  args: {
    assigneeId: v.id("assignees"),
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all JIT assignments for the assignee
    const jitAssignments = await ctx.db
      .query("assignee_jit_assignment")
      .withIndex("by_assignee_date", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();

    // Filter by date range
    return jitAssignments.filter((assignment) => {
      return assignment.date >= args.startMs && assignment.date <= args.endMs;
    });
  },
});

