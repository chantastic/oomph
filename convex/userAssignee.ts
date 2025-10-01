import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const find = query({
  args: { id: v.id("user_assignee") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const links = await ctx.db
      .query("user_assignee")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const assignees = await Promise.all(
      links.map((l) => ctx.db.get(l.assigneeId))
    );

    return assignees.filter(Boolean);
  },
});


export const getByAssignee = query({
  args: { assigneeId: v.id("assignee") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_assignee")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});


export const upsert = mutation({
  args: {
    id: v.optional(v.id("user_assignee")),
    userId: v.string(),
    assigneeId: v.id("assignee"),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      // Update existing user_assignee
      await ctx.db.patch(args.id, {
        userId: args.userId,
        assigneeId: args.assigneeId,
      });
      return args.id;
    } else {
      // Create new user_assignee
      return await ctx.db.insert("user_assignee", {
        userId: args.userId,
        assigneeId: args.assigneeId,
      });
    }
  },
});

export const destroy = mutation({
  args: { id: v.id("user_assignee") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

