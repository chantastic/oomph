import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isValidCron } from "cron-validator";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("assignee_task_schedules"),
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
    const schedules = await ctx.db.query("assignee_task_schedules").collect();

    // Fetch related data for each schedule
    const schedulesWithRelations = await Promise.all(
      schedules.map(async (schedule) => {
        const assignee = await ctx.db.get(schedule.assigneeId);
        const task = await ctx.db.get(schedule.taskId);

        if (!assignee || !task) {
          throw new Error("Missing related data");
        }

        return {
          ...schedule,
          assignee,
          task,
        };
      }),
    );

    return schedulesWithRelations;
  },
});

export const create = mutation({
  args: {
    assigneeId: v.id("assignees"),
    taskId: v.id("tasks"),
    cronSchedule: v.string(),
  },
  returns: v.id("assignee_task_schedules"),
  handler: async (ctx, args) => {
    // Verify that both assignee and task exist
    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee) {
      throw new Error("Assignee not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Create the schedule relationship
    const id = await ctx.db.insert("assignee_task_schedules", {
      assigneeId: args.assigneeId,
      taskId: args.taskId,
      cronSchedule: args.cronSchedule,
    });

    return id;
  },
});

function parseField(field: string, isDayOfWeek: boolean = false): number[] {
  if (field === "*") return [-1]; // -1 represents wildcard

  const values: number[] = [];
  const parts = field.split(",");

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => {
        const num = parseInt(n);
        // Convert cron day numbers (1-7) to JS day numbers (0-6)
        if (isDayOfWeek) {
          // In cron: 1=Monday, 7=Sunday
          // In JS: 0=Sunday, 1=Monday
          // So 7 should become 0
          return num === 7 ? 0 : num;
        }
        return num;
      });
      for (let i = start; i <= end; i++) {
        values.push(i);
      }
    } else {
      const num = parseInt(part);
      if (isDayOfWeek) {
        // Same conversion as above
        values.push(num === 7 ? 0 : num);
      } else {
        values.push(num);
      }
    }
  }

  console.log(`Parsed field "${field}" (isDayOfWeek=${isDayOfWeek}):`, values);
  return values;
}

function matchesField(
  cronValues: number[],
  currentValue: number,
  fieldName: string,
): boolean {
  // If cronValues contains -1, it's a wildcard
  if (cronValues.includes(-1)) {
    console.log(`${fieldName}: Wildcard match`);
    return true;
  }
  const matches = cronValues.includes(currentValue);
  console.log(
    `${fieldName}: ${currentValue} in [${cronValues.join(",")}] = ${matches}`,
  );
  return matches;
}

export const getTasksForToday = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("assignee_task_schedules"),
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
    const schedules = await ctx.db.query("assignee_task_schedules").collect();

    const now = new Date();
    // JavaScript days are 0-6 (Sunday-Saturday)
    const currentDayOfWeek = now.getDay();
    const currentDayOfMonth = now.getDate();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based

    console.log("Current date:", {
      dayOfWeek: currentDayOfWeek,
      dayOfMonth: currentDayOfMonth,
      month: currentMonth,
      fullDate: now.toISOString(),
    });

    // Filter schedules that match today's date
    const todaySchedules = schedules.filter((schedule) => {
      try {
        if (!isValidCron(schedule.cronSchedule)) {
          console.error("Invalid cron expression:", schedule.cronSchedule);
          return false;
        }

        console.log("\nProcessing schedule:", schedule.cronSchedule);

        // Split cron expression (minute hour dayMonth month dayWeek)
        const [, , dayMonth, month, dayWeek] = schedule.cronSchedule.split(" ");

        // Parse each field into arrays of valid values
        const validMonths = parseField(month);
        const validDaysOfMonth = parseField(dayMonth);
        const validDaysOfWeek = parseField(dayWeek, true); // true indicates this is a day of week field

        // Check if current date matches the schedule
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

        // If a specific day of week is specified (not *), it takes precedence
        const isDayOfWeekWildcard = validDaysOfWeek.includes(-1);
        const finalResult =
          monthMatches &&
          (isDayOfWeekWildcard ? dayOfMonthMatches : dayOfWeekMatches);

        console.log("Match details:", {
          isDayOfWeekWildcard,
          monthMatches,
          dayOfMonthMatches,
          dayOfWeekMatches,
          finalResult,
        });

        return finalResult;
      } catch (e) {
        console.error("Error processing cron schedule:", e);
        return false;
      }
    });

    // Fetch related data for each schedule
    const schedulesWithRelations = await Promise.all(
      todaySchedules.map(async (schedule) => {
        const assignee = await ctx.db.get(schedule.assigneeId);
        const task = await ctx.db.get(schedule.taskId);

        if (!assignee || !task) {
          throw new Error("Missing related data");
        }

        return {
          ...schedule,
          assignee,
          task,
        };
      }),
    );

    return schedulesWithRelations;
  },
});
