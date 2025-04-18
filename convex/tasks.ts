import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
      title: v.string(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
    });
    return taskId;
  },
});
