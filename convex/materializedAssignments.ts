import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { shouldShowAssignmentOnDate } from "../lib/utils";

// Get all assignee assignments for an assignee
export const getByAssignee = query({
  args: { assigneeId: v.id("assignees") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignee_assignment")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});

// Create an assignee assignment
export const create = mutation({
  args: {
    assigneeId: v.id("assignees"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assignee_assignment", {
      assigneeId: args.assigneeId,
      title: args.title,
      description: args.description,
    });
  },
});

// Mark an assignee assignment as completed
export const markCompleted = mutation({
  args: {
    assigneeAssignmentId: v.id("assignee_assignment"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assigneeAssignmentId, {
      status: "complete",
    });
  },
});

// Mark an assignee assignment as not completed (remove status)
export const markNotCompleted = mutation({
  args: {
    assigneeAssignmentId: v.id("assignee_assignment"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assigneeAssignmentId, {
      status: undefined,
    });
  },
});

// Delete an assignee assignment
export const deleteById = mutation({
  args: { assigneeAssignmentId: v.id("assignee_assignment") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.assigneeAssignmentId);
  },
});

// Test function to materialize assignments for today
export const materializeForToday = mutation({
  args: { assigneeId: v.id("assignees") },
  handler: async (ctx, args) => {
    const today = new Date();
    
    // Get all assignment templates for this assignee
    const assignments = await ctx.db
      .query("assignee_assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
    
    const materialized = [];
    
    for (const assignment of assignments) {
      // Check if this assignment should be materialized for today
      if (shouldShowAssignmentOnDate(assignment.cronSchedule, today)) {
        // Check if already materialized (by title match)
        const existing = await ctx.db
          .query("assignee_assignment")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
          .filter((q) => q.eq(q.field("title"), assignment.title))
          .first();
          
        if (!existing) {
          // Create assignee assignment
          const assigneeAssignmentId = await ctx.db.insert("assignee_assignment", {
            assigneeId: args.assigneeId,
            title: assignment.title,
            description: assignment.description,
          });
          
          materialized.push({
            id: assigneeAssignmentId,
            title: assignment.title,
            description: assignment.description,
          });
        }
      }
    }
    
    return {
      materialized,
      count: materialized.length,
    };
  },
});

// Get all assignees (for testing purposes)
export const getAllAssignees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assignees").collect();
  },
});
