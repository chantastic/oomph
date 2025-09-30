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
  args: { 
    assigneeId: v.id("assignees"),
  },
  handler: async (ctx, args) => {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    
    // Get assignment descriptors for this assignee
    const assignmentDescriptors = await ctx.db
      .query("assignee_assignment_descriptor")
      .withIndex("by_assignee", (q: any) => q.eq("assigneeId", args.assigneeId))
      .collect();
    
    // Get existing assignments for this assignee
    const existingAssignments = await ctx.db
      .query("assignee_assignment")
      .withIndex("by_assignee", (q: any) => q.eq("assigneeId", args.assigneeId))
      .collect();
    
    // Create lookup map for efficient duplicate checking
    const existingByTitle = new Map<string, any>();
    for (const existing of existingAssignments) {
      existingByTitle.set(existing.title, existing);
    }
    
    const materialized = [];
    
    for (const assignment of assignmentDescriptors) {
      // Check if this assignment should be materialized for today
      if (shouldShowAssignmentOnDate(assignment.cronSchedule, today)) {
        // Check if already materialized (by title match) - now O(1) lookup
        if (!existingByTitle.has(assignment.title)) {
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

// Materialize assignments for all assignees with optimized batching
export const materializeForAllAssignees = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    
    // Batch 1: Get all assignees and all assignment descriptors in parallel
    const [assignees, allAssignmentDescriptors] = await Promise.all([
      ctx.db.query("assignees").collect(),
      ctx.db.query("assignee_assignment_descriptor").collect()
    ]);
    
    // Batch 2: Get all existing assignments for all assignees in one query
    const allExistingAssignments = await ctx.db.query("assignee_assignment").collect();
    
    // Create lookup maps for efficient checking
    const existingAssignmentsByAssignee = new Map<string, Map<string, any>>();
    for (const existing of allExistingAssignments) {
      if (!existingAssignmentsByAssignee.has(existing.assigneeId)) {
        existingAssignmentsByAssignee.set(existing.assigneeId, new Map());
      }
      existingAssignmentsByAssignee.get(existing.assigneeId)!.set(existing.title, existing);
    }
    
    const assignmentDescriptorsByAssignee = new Map<string, any[]>();
    for (const descriptor of allAssignmentDescriptors) {
      if (!assignmentDescriptorsByAssignee.has(descriptor.assigneeId)) {
        assignmentDescriptorsByAssignee.set(descriptor.assigneeId, []);
      }
      assignmentDescriptorsByAssignee.get(descriptor.assigneeId)!.push(descriptor);
    }
    
    const results = [];
    let totalMaterialized = 0;
    
    // Process each assignee
    for (const assignee of assignees) {
      const assigneeId = assignee._id;
      const assignmentDescriptors = assignmentDescriptorsByAssignee.get(assigneeId) || [];
      const existingAssignments = existingAssignmentsByAssignee.get(assigneeId) || new Map();
      
      const materialized = [];
      
      for (const assignment of assignmentDescriptors) {
        // Check if this assignment should be materialized for today
        if (shouldShowAssignmentOnDate(assignment.cronSchedule, today)) {
          // Check if already materialized (by title match) - now O(1) lookup
          if (!existingAssignments.has(assignment.title)) {
            // Create assignee assignment
            const assigneeAssignmentId = await ctx.db.insert("assignee_assignment", {
              assigneeId,
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
      
      totalMaterialized += materialized.length;
      
      results.push({
        assigneeId: assignee._id,
        assigneeName: assignee.name,
        materialized,
        count: materialized.length,
      });
    }
    
    return {
      results,
      totalMaterialized,
    };
  },
});
