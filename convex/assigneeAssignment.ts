import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "./constants";


export const find = query({
  args: { id: v.id("assignee_assignment") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all assignee assignments for an assignee
export const getByAssignee = query({
  args: { assigneeId: v.id("assignee") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignee_assignment")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});

// Create an assignee assignment
export const upsert = mutation({
  args: {
    id: v.optional(v.id("assignee_assignment")),
    assigneeId: v.id("assignee"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal(ASSIGNMENT_STATUS.COMPLETE))),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      // Update existing assignment
      await ctx.db.patch(args.id, {
        assigneeId: args.assigneeId,
        title: args.title,
        description: args.description,
        status: args.status,
      });
      return args.id;
    } else {
      // Create new assignment
      return await ctx.db.insert("assignee_assignment", {
        assigneeId: args.assigneeId,
        title: args.title,
        description: args.description,
        status: args.status,
      });
    }
  },
});


// Delete an assignee assignment
export const destroy = mutation({
  args: { id: v.id("assignee_assignment") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
