// This file implements the assignments logic, previously named assignee_task_schedules

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isValidCron } from "cron-validator";

export const list = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("assignments"),
      _creationTime: v.number(),
      assigneeId: v.id("assignees"),
      cronSchedule: v.string(),
      title: v.string(),
      assignee: v.object({
        _id: v.id("assignees"),
        _creationTime: v.number(),
        name: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all assignees that belong to this user
    const userAssignees = await ctx.db
      .query("user_assignees")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // If no relationships exist, return empty array
    if (userAssignees.length === 0) {
      return [];
    }

    // Get all assignee IDs that this user has access to
    const assigneeIds = userAssignees.map((ua) => ua.assigneeId);

    // Get all assignments for these assignees
    const assignments = await Promise.all(
      assigneeIds.map((assigneeId) =>
        ctx.db
          .query("assignments")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", assigneeId))
          .collect(),
      ),
    ).then((results) => results.flat());

    // Add assignee details to each assignment
    const assignmentsWithRelations = await Promise.all(
      assignments.map(async (assignment) => {
        const assignee = await ctx.db.get(assignment.assigneeId);
        if (!assignee) {
          throw new Error("Missing related data");
        }
        return {
          ...assignment,
          assignee,
        };
      }),
    );
    return assignmentsWithRelations;
  },
});

export const create = mutation({
  args: {
    assigneeId: v.id("assignees"),
    cronSchedule: v.string(),
    title: v.string(),
  },
  returns: v.id("assignments"),
  handler: async (ctx, args) => {
    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee) {
      throw new Error("Assignee not found");
    }
    const existingForAssignee = await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
    if (existingForAssignee.some((s) => s.title === args.title)) {
      throw new Error("Assignment already exists for this assignee and title");
    }
    const id = await ctx.db.insert("assignments", {
      assigneeId: args.assigneeId,
      cronSchedule: args.cronSchedule,
      title: args.title,
    });
    return id;
  },
});

function normalizeDayOfWeek(day: number): number {
  if (day === 7) return 0;
  return day;
}

function parseField(field: string, isDayOfWeek: boolean = false): number[] {
  if (field === "*") return [-1];
  const values: number[] = [];
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => {
        const num = parseInt(n);
        return isDayOfWeek ? normalizeDayOfWeek(num) : num;
      });
      if (isDayOfWeek && start > end) {
        for (let i = start; i <= 6; i++) values.push(i);
        for (let i = 0; i <= end; i++) values.push(i);
      } else {
        for (let i = start; i <= end; i++) {
          values.push(isDayOfWeek ? normalizeDayOfWeek(i) : i);
        }
      }
    } else {
      const num = parseInt(part);
      values.push(isDayOfWeek ? normalizeDayOfWeek(num) : num);
    }
  }
  return values;
}

function matchesField(
  cronValues: number[],
  currentValue: number,
  fieldName: string,
): boolean {
  if (cronValues.includes(-1)) {
    return true;
  }
  return cronValues.includes(currentValue);
}

export const getTasksForToday = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("assignments"),
      _creationTime: v.number(),
      assigneeId: v.id("assignees"),
      cronSchedule: v.string(),
      title: v.string(),
      assignee: v.object({
        _id: v.id("assignees"),
        _creationTime: v.number(),
        name: v.string(),
      }),
    }),
  ),
  handler: async (ctx) => {
    const assignments = await ctx.db.query("assignments").collect();
    const now = new Date();
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const currentDayOfWeek = utcNow.getUTCDay();
    const currentDayOfMonth = utcNow.getUTCDate();
    const currentMonth = utcNow.getUTCMonth() + 1;
    const todayAssignments = assignments.filter((assignment) => {
      try {
        if (!isValidCron(assignment.cronSchedule)) {
          return false;
        }
        const [, , dayMonth, month, dayWeek] =
          assignment.cronSchedule.split(" ");
        const validMonths = parseField(month);
        const validDaysOfMonth = parseField(dayMonth);
        const validDaysOfWeek = parseField(dayWeek, true);
        const monthMatches = matchesField(validMonths, currentMonth, "Month");
        const dayOfMonthMatches = matchesField(
          validDaysOfMonth,
          currentDayOfMonth,
          "DayOfMonth",
        );
        const dayOfWeekMatches = matchesField(
          validDaysOfWeek,
          currentDayOfWeek,
          "DayOfWeek",
        );
        const isDayOfWeekWildcard = validDaysOfWeek.includes(-1);
        const finalResult =
          monthMatches &&
          (isDayOfWeekWildcard ? dayOfMonthMatches : dayOfWeekMatches);
        return finalResult;
      } catch (e) {
        return false;
      }
    });
    const assignmentsWithRelations = await Promise.all(
      todayAssignments.map(async (assignment) => {
        const assignee = await ctx.db.get(assignment.assigneeId);
        if (!assignee) {
          throw new Error("Missing related data");
        }
        return {
          ...assignment,
          assignee,
        };
      }),
    );
    return assignmentsWithRelations;
  },
});
