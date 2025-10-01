import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const find = query({
  args: { id: v.id("assignee_assignment_descriptor") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAssignee = query({
  args: { assigneeId: v.id("assignee") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignee_assignment_descriptor")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("assignee_assignment_descriptor")),
    assigneeId: v.id("assignee"),
    title: v.string(),
    cronSchedule: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      // Update existing descriptor
      return await ctx.db.patch(args.id, {
        title: args.title,
        cronSchedule: args.cronSchedule,
        description: args.description,
      });
    } else {
      // Create new descriptor
      return await ctx.db.insert("assignee_assignment_descriptor", {
        assigneeId: args.assigneeId,
        title: args.title,
        cronSchedule: args.cronSchedule,
        description: args.description,
      });
    }
  },
});

export const destroy = mutation({
  args: { id: v.id("assignee_assignment_descriptor") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

