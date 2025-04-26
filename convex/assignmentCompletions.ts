import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCompletion = mutation({
  args: {
    assignmentId: v.id("assignments"),
    completedAt: v.number(),
  },
  returns: v.id("assignment_completions"),
  handler: async (ctx, args) => {
    const completionId = await ctx.db.insert("assignment_completions", {
      assignmentId: args.assignmentId,
      completedAt: args.completedAt,
    });
    return completionId;
  },
});

export const deleteCompletion = mutation({
  args: {
    completionId: v.id("assignment_completions"),
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
      _id: v.id("assignment_completions"),
      assignmentId: v.id("assignments"),
      completedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("assignment_completions")
      .withIndex("by_completedAt", (q) =>
        q.gte("completedAt", args.start).lte("completedAt", args.end),
      )
      .collect();
    return rows.map((row) => ({
      _id: row._id,
      assignmentId: row.assignmentId,
      completedAt: row.completedAt,
    }));
  },
});
