import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
