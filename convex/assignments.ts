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
      cronSchedule: v.string(),
      title: v.string(),
      assignee: v.object({
        _id: v.id("assignees"),
        _creationTime: v.number(),
        name: v.string(),
        userId: v.optional(v.id("users")),
      }),
    }),
  ),
  handler: async (ctx) => {
    const assignments = await ctx.db.query("assignments").collect();
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

function matchesField(cronValues: number[], currentValue: number): boolean {
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
        userId: v.optional(v.id("users")),
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
        const monthMatches = matchesField(validMonths, currentMonth);
        const dayOfMonthMatches = matchesField(
          validDaysOfMonth,
          currentDayOfMonth,
        );
        const dayOfWeekMatches = matchesField(
          validDaysOfWeek,
          currentDayOfWeek,
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

export const listUniqueTitles = query({
  args: {},
  returns: v.array(
    v.object({
      title: v.string(),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const assignments = await ctx.db
      .query("assignments")
      .order("desc")
      .collect();
    const seen = new Set<string>();
    const uniqueTitles: Array<{ title: string; _creationTime: number }> = [];
    for (const assignment of assignments) {
      if (!seen.has(assignment.title)) {
        seen.add(assignment.title);
        uniqueTitles.push({
          title: assignment.title,
          _creationTime: assignment._creationTime,
        });
      }
    }
    return uniqueTitles;
  },
});

export const listByAssignee = query({
  args: { assigneeId: v.id("assignees") },
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
        userId: v.optional(v.id("users")),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
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

export const listForAssigneeWeekView = query({
  args: {
    assigneeId: v.id("assignees"),
    start: v.number(),
    end: v.number(),
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
        userId: v.optional(v.id("users")),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    // Only return assignments for the given assignee
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
    // (Optional: could filter by week if assignments had a date, but cronSchedule is used for recurrence)
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

export const listForAssigneeDayView = query({
  args: {
    assigneeId: v.id("assignees"),
    dayEpoch: v.number(), // ms since epoch, start of day
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
        userId: v.optional(v.id("users")),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
    // Determine the day of week for the given dayEpoch (0=Sunday)
    const date = new Date(args.dayEpoch);
    const dayOfWeek = date.getDay();
    // Filter assignments by cronSchedule for this day
    function isDayScheduled(cronSchedule: string, dayOfWeek: number): boolean {
      try {
        const [, , , , dayField] = cronSchedule.split(" ");
        if (dayField === "*") return true;
        const days = dayField.split(",").flatMap((part: string) => {
          if (part.includes("-")) {
            const [start, end] = part.split("-").map(Number);
            if (start > end) {
              const range = [];
              for (let i = start; i <= 6; i++) range.push(i);
              for (let i = 0; i <= end; i++) range.push(i);
              return range;
            }
            return Array.from(
              { length: end - start + 1 },
              (_, i) => start + i,
            ).map((d) => (d === 7 ? 0 : d));
          }
          const day = Number(part);
          return [day === 7 ? 0 : day];
        });
        return days.includes(dayOfWeek);
      } catch (e) {
        return false;
      }
    }
    const filtered = assignments.filter((a) =>
      isDayScheduled(a.cronSchedule, dayOfWeek),
    );
    const assignmentsWithRelations = await Promise.all(
      filtered.map(async (assignment) => {
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
