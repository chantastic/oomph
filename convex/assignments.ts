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

