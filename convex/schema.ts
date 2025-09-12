import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  /*
   * Assignments Completions are the core reporting model of the app.
   * They log the date a datetime an assignment was completed.
   */
  assignment_completions: defineTable({
    assignmentId: v.id("assignee_assignments"),
    time: v.number(),
  })
    .index("by_time", ["time"])
    .index("by_assignment_time", ["assignmentId", "time"]),
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
})

export default schema
