import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
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
  assignee_assignment_descriptor: defineTable({
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

  assignee_assignment: defineTable({
    assigneeId: v.id("assignees"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("complete"))),
  })
    .index("by_assignee", ["assigneeId"])
})

export default schema
