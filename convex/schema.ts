import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  /*
   * Assignment Completions are the core reporting model of the app.
   * They log the date and time an assignment was completed.
   * Works for both regular assignments and JIT assignments.
   */
  assignment_completions: defineTable({
    assignmentId: v.string(), // Can be either assignee_assignments or assignee_jit_assignment ID
    assignmentType: v.union(v.literal("cron"), v.literal("jit")),
    time: v.number(),
  })
    .index("by_time", ["time"])
    .index("by_assignment_time", ["assignmentId", "time"])
    .index("by_type_time", ["assignmentType", "time"]),
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
  assignee_assignments: defineTable({
    assigneeId: v.id("assignees"),
    cronSchedule: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  }).index("by_assignee", ["assigneeId"]),

  /*
   * UserAssignee is the many-to-many relationship between users and assignees.
   */
  user_assignee: defineTable({
    userId: v.string(),
    assigneeId: v.id("assignees"),
  })
    .index("by_user", ["userId"])
    .index("by_assignee", ["assigneeId"]),

  /*
   * JIT (Just in Time) assignments are one-time assignments for a specific date.
   * These appear only on the date they were created for.
   */
  assignee_jit_assignment: defineTable({
    assigneeId: v.id("assignees"),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.number(), // timestamp for the date this assignment is for
  }).index("by_assignee_date", ["assigneeId", "date"]),
})

export default schema
