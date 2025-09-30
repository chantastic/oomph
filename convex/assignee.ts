import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(api.userAssignee.getByAuthenticatedUser, {});
  },
});

export const getAssignee = query({
  args: { assigneeId: v.id("assignee") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assigneeId);
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

    await ctx.runMutation(api.userAssignee.create, {
      userId: identity.subject,
      assigneeId,
    });

    return assigneeId;
  },
});

// Get all assignees (for testing purposes)
export const getAllAssignees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assignee").collect();
  },
});
