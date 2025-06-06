import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v, Infer } from "convex/values";

export const CURRENCIES = {
  USD: "usd",
  EUR: "eur",
} as const;
export const currencyValidator = v.union(
  v.literal(CURRENCIES.USD),
  v.literal(CURRENCIES.EUR),
);
export type Currency = Infer<typeof currencyValidator>;

export const INTERVALS = {
  MONTH: "month",
  YEAR: "year",
} as const;
export const intervalValidator = v.union(
  v.literal(INTERVALS.MONTH),
  v.literal(INTERVALS.YEAR),
);
export type Interval = Infer<typeof intervalValidator>;

export const PLANS = {
  FREE: "free",
  PRO: "pro",
} as const;
export const planKeyValidator = v.union(
  v.literal(PLANS.FREE),
  v.literal(PLANS.PRO),
);
export type PlanKey = Infer<typeof planKeyValidator>;

const priceValidator = v.object({
  stripeId: v.string(),
  amount: v.number(),
});
const pricesValidator = v.object({
  [CURRENCIES.USD]: priceValidator,
  [CURRENCIES.EUR]: priceValidator,
});

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    customerId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("customerId", ["customerId"]),
  plans: defineTable({
    key: planKeyValidator,
    stripeId: v.string(),
    name: v.string(),
    description: v.string(),
    prices: v.object({
      [INTERVALS.MONTH]: pricesValidator,
      [INTERVALS.YEAR]: pricesValidator,
    }),
  })
    .index("key", ["key"])
    .index("stripeId", ["stripeId"]),
  subscriptions: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    priceStripeId: v.string(),
    stripeId: v.string(),
    currency: currencyValidator,
    interval: intervalValidator,
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  })
    .index("userId", ["userId"])
    .index("stripeId", ["stripeId"]),
  tasks: defineTable({
    title: v.string(),
  }),
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
  assignees: defineTable({
    name: v.string(),
    userId: v.optional(v.id("users")),
  }).index("by_userId", ["userId"]),
  /*
   * user_assignees is a join table that establishes which users have access to which assignees.
   * This enables future support for many-to-many relationships between users and assignees.
   */
  user_assignees: defineTable({
    userId: v.id("users"),
    assigneeId: v.id("assignees"),
  })
    .index("by_user", ["userId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_user_and_assignee", ["userId", "assigneeId"]),
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
