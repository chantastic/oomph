// This file implements the assignments logic, previously named assignee_task_schedules

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isValidCron } from "cron-validator";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("assignments"),
      _creationTime: v.number(),
      assigneeId: v.id("assignees"),
      taskId: v.id("tasks"),
      cronSchedule: v.string(),
      assignee: v.object({
        _id: v.id("assignees"),
        _creationTime: v.number(),
        name: v.string(),
      }),
      task: v.object({
        _id: v.id("tasks"),
        _creationTime: v.number(),
        title: v.string(),
      }),
    }),
  ),
  handler: async (ctx) => {
    const assignments = await ctx.db.query("assignments").collect();
    const assignmentsWithRelations = await Promise.all(
      assignments.map(async (assignment) => {
        const assignee = await ctx.db.get(assignment.assigneeId);
        const task = await ctx.db.get(assignment.taskId);
        if (!assignee || !task) {
          throw new Error("Missing related data");
        }
        return {
          ...assignment,
          assignee,
          task,
        };
      }),
    );
    return assignmentsWithRelations;
  },
});

export const create = mutation({
  args: {
    assigneeId: v.id("assignees"),
    taskId: v.id("tasks"),
    cronSchedule: v.string(),
  },
  returns: v.id("assignments"),
  handler: async (ctx, args) => {
    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee) {
      throw new Error("Assignee not found");
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const existingForAssignee = await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
    if (existingForAssignee.some((s) => s.taskId === args.taskId)) {
      throw new Error("Assignment already exists for this assignee and task");
    }
    const id = await ctx.db.insert("assignments", {
      assigneeId: args.assigneeId,
      taskId: args.taskId,
      cronSchedule: args.cronSchedule,
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
      taskId: v.id("tasks"),
      cronSchedule: v.string(),
      assignee: v.object({
        _id: v.id("assignees"),
        _creationTime: v.number(),
        name: v.string(),
      }),
      task: v.object({
        _id: v.id("tasks"),
        _creationTime: v.number(),
        title: v.string(),
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
        const task = await ctx.db.get(assignment.taskId);
        if (!assignee || !task) {
          throw new Error("Missing related data");
        }
        return {
          ...assignment,
          assignee,
          task,
        };
      }),
    );
    return assignmentsWithRelations;
  },
});
