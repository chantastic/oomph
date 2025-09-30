import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
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
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const assigneeId = await ctx.db.insert("assignee", {
      name: args.name,
    });

    await ctx.db.insert("user_assignee", {
      userId: identity.subject,
      assigneeId,
    });

    return assigneeId;
  },
});
