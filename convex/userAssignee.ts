import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByAuthenticatedUser = query({
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

export const create = mutation({
  args: {
    userId: v.string(),
    assigneeId: v.id("assignee"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("user_assignee", {
      userId: args.userId,
      assigneeId: args.assigneeId,
    });
  },
});

export const destroy = mutation({
  args: {
    userId: v.string(),
    assigneeId: v.id("assignee"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("user_assignee")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("assigneeId"), args.assigneeId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});
