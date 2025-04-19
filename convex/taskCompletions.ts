import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCompletion = mutation({
  args: {
    taskId: v.id("tasks"),
    assigneeId: v.id("assignees"),
    completedAt: v.number(),
  },
  returns: v.id("task_completions"),
  handler: async (ctx, args) => {
    const completionId = await ctx.db.insert("task_completions", {
      taskId: args.taskId,
      assigneeId: args.assigneeId,
      completedAt: args.completedAt,
    });
    return completionId;
  },
});

export const deleteCompletion = mutation({
  args: {
    completionId: v.id("task_completions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.completionId);
    return null;
  },
});

export const getCompletions = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("task_completions"),
      taskId: v.id("tasks"),
      assigneeId: v.id("assignees"),
      completedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("task_completions")
      .withIndex("by_completedAt", (q) =>
        q.gte("completedAt", args.start).lte("completedAt", args.end),
      )
      .collect();
    // Map to include only fields in the validator
    return rows.map((row) => ({
      _id: row._id,
      taskId: row.taskId,
      assigneeId: row.assigneeId,
      completedAt: row.completedAt,
    }));
  },
});
