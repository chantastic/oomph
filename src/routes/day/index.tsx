import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/day/")({
  component: () => {
    // @ts-ignore: assignments may not be in the generated API until convex dev is run
    const scheduledTasks = useQuery(api.assignments?.getTasksForToday);

    if (scheduledTasks === undefined) {
      return <div>Loading...</div>;
    }

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Today's Tasks</h1>

        <div className="space-y-4">
          {scheduledTasks.map((schedule: any) => (
            <div
              key={schedule._id}
              className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg">{schedule.task.title}</p>
                <p className="text-sm text-gray-500">
                  Assigned to: {schedule.assignee.name}
                </p>
                <p className="text-sm text-gray-500">
                  Schedule: {schedule.cronSchedule}
                </p>
              </div>
            </div>
          ))}
          {scheduledTasks.length === 0 && (
            <p className="text-center text-gray-500">
              No tasks scheduled for today.
            </p>
          )}
        </div>
      </div>
    );
  },
});
