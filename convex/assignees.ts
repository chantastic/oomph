import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("assignees"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.optional(v.id("users")),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all user-assignee relationships for this user
    const userAssignees = await ctx.db
      .query("user_assignees")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // If no relationships exist, return empty array
    if (userAssignees.length === 0) {
      return [];
    }

    // Get all assignees that this user has access to
    const assigneeIds = userAssignees.map((ua) => ua.assigneeId);
    const assignees = await Promise.all(
      assigneeIds.map(async (assigneeId) => {
        const assignee = await ctx.db.get(assigneeId);
        return assignee || null; // Return null for non-existent assignees
      }),
    );

    // Filter out any null values
    return assignees.filter((assignee) => assignee !== null);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
  },
  returns: v.id("assignees"),
  handler: async (ctx, args) => {
    const assigneeId = await ctx.db.insert("assignees", {
      name: args.name,
      // userId is optional now, so we don't need to provide it
    });

    // Create the user-assignee relationship
    await ctx.db.insert("user_assignees", {
      userId: args.userId,
      assigneeId: assigneeId,
    });

    return assigneeId;
  },
});

export const getById = query({
  args: { assigneeId: v.id("assignees") },
  returns: v.optional(
    v.object({
      _id: v.id("assignees"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.optional(v.id("users")),
    }),
  ),
  handler: async (ctx, { assigneeId }) => {
    const assignee = await ctx.db.get(assigneeId);
    return assignee === null ? undefined : assignee;
  },
});
