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

function normalizeDayOfWeek(day: number): number {
  // Convert both 0-6 and 1-7 formats to 0-6 (JavaScript format)
  if (day === 7) return 0; // Sunday as 7 becomes 0
  return day;
}

function parseField(field: string, isDayOfWeek: boolean = false): number[] {
  if (field === "*") return [-1]; // -1 represents wildcard

  const values: number[] = [];
  const parts = field.split(",");

  console.log(`Parsing field "${field}"`, {
    isDayOfWeek,
    parts,
  });

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => {
        const num = parseInt(n);
        return isDayOfWeek ? normalizeDayOfWeek(num) : num;
      });
      // For ranges, we need to handle the case where the range crosses Sunday
      if (isDayOfWeek && start > end) {
        // Example: 5-2 means Fri,Sat,Sun,Mon,Tue
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

  console.log(
    `Final parsed values for "${field}" (isDayOfWeek=${isDayOfWeek}):`,
    values,
  );
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
    // Get the date in UTC to avoid timezone issues
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const currentDayOfWeek = utcNow.getUTCDay(); // 0-6, Sunday-Saturday
    const currentDayOfMonth = utcNow.getUTCDate();
    const currentMonth = utcNow.getUTCMonth() + 1; // JavaScript months are 0-based

    console.log("Current date:", {
      dayOfWeek: currentDayOfWeek,
      dayName: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][currentDayOfWeek],
      dayOfMonth: currentDayOfMonth,
      month: currentMonth,
      localDate: now.toISOString(),
      utcDate: utcNow.toISOString(),
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
          currentDayOfWeek,
          validDaysOfWeek,
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
