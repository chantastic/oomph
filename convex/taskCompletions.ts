import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createCompletion = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.id("task_completions"),
  handler: async (ctx, args) => {
    const completionId = await ctx.db.insert("task_completions", {
      taskId: args.taskId,
    });
    return completionId;
  },
});
