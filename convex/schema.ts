import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { ASSIGNMENT_STATUS } from "./constants"

const schema = defineSchema({
  assignee: defineTable({
    name: v.string(),
    timezoneOffset: v.optional(v.number()),
  }),

  assignee_assignment_descriptor: defineTable({
    assigneeId: v.id("assignee"),
    cronSchedule: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  }).index("by_assignee", ["assigneeId"]),

  user_assignee: defineTable({
    userId: v.string(),
    assigneeId: v.id("assignee"),
  })
    .index("by_user", ["userId"])
    .index("by_assignee", ["assigneeId"]),

  assignee_assignment: defineTable({
    assigneeId: v.id("assignee"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal(ASSIGNMENT_STATUS.COMPLETE))),
  })
    .index("by_assignee", ["assigneeId"])
})

export default schema
