import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const find = query({
  args: { assigneeId: v.id("assignee") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assigneeId);
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("assignee")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    if (args.id) {
      // Update existing assignee
      await ctx.db.patch(args.id, {
        name: args.name,
      });
      return args.id;
    } else {
      // Create new assignee
      const assigneeId = await ctx.db.insert("assignee", {
        name: args.name,
        timezoneOffset: -480, // UTC-8 (PST/PDT) default
      });

      await ctx.runMutation(api.userAssignee.upsert, {
        userId: identity.subject,
        assigneeId,
      });

      return assigneeId;
    }
  },
});

export const destroy = mutation({
  args: { assigneeId: v.id("assignee") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.assigneeId);
  },
});
