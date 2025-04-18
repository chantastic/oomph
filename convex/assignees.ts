import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("assignees"),
      _creationTime: v.number(),
      name: v.string(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("assignees").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("assignees"),
  handler: async (ctx, args) => {
    const assigneeId = await ctx.db.insert("assignees", {
      name: args.name,
    });
    return assigneeId;
  },
});
