import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  /*
   * Assignments Completions are the core reporting model of the app.
   * They log the date a datetime an assignment was completed.
   */
  assignment_completions: defineTable({
    assignmentId: v.id("assignments"),
    completedAt: v.number(),
  })
    .index("by_completedAt", ["completedAt"])
    .index("by_assignment_completedAt", ["assignmentId", "completedAt"]),
  /*
   * Assignees are the people who are assigned to tasks.
   */
  assignees: defineTable({
    name: v.string(),
  }),
  /*
   * Assignments are the core interactive model of the app.
   * A User assigns tasks to an Assignee on a cronSchedule.
   */
  assignments: defineTable({
    assigneeId: v.id("assignees"),
    cronSchedule: v.string(),
    title: v.string(),
  }).index("by_assignee", ["assigneeId"]),
});

export default schema;
