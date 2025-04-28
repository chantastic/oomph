import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("assignees"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.id("users"),
    }),
  ),
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("assignees")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("assignees"),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const assigneeId = await ctx.db.insert("assignees", {
      name: args.name,
      userId,
    });
    return assigneeId;
  },
});
