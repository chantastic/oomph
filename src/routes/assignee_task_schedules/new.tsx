import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";

interface Assignee {
  _id: Id<"assignees">;
  name: string;
}

interface Task {
  _id: Id<"tasks">;
  title: string;
}

export const Route = createFileRoute("/assignee_task_schedules/new")({
  component: () => {
    const navigate = useNavigate();
    const assignees = useQuery(api.assignees.list);
    const tasks = useQuery(api.tasks.list);
    const createAssigneeTaskSchedule = useMutation(
      api.assignee_task_schedules.create,
    );

    const [selectedAssignee, setSelectedAssignee] = useState<
      Id<"assignees"> | ""
    >("");
    const [selectedTask, setSelectedTask] = useState<Id<"tasks"> | "">("");
    const [cronSchedule, setCronSchedule] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedAssignee && selectedTask && cronSchedule.trim()) {
        await createAssigneeTaskSchedule({
          assigneeId: selectedAssignee,
          taskId: selectedTask,
          cronSchedule: cronSchedule.trim(),
        });
        navigate({ to: "/assignee_task_schedules" });
      }
    };

    if (assignees === undefined || tasks === undefined) {
      return <div>Loading...</div>;
    }

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Schedule Task for Assignee</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="assignee"
              className="block text-sm font-medium text-gray-700"
            >
              Assignee
            </label>
            <select
              id="assignee"
              value={selectedAssignee}
              onChange={(e) =>
                setSelectedAssignee(e.target.value as Id<"assignees">)
              }
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Select Assignee</option>
              {assignees.map((assignee) => (
                <option key={assignee._id} value={assignee._id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="task"
              className="block text-sm font-medium text-gray-700"
            >
              Task
            </label>
            <select
              id="task"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value as Id<"tasks">)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Select Task</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="cronSchedule"
              className="block text-sm font-medium text-gray-700"
            >
              Cron Schedule
            </label>
            <input
              type="text"
              id="cronSchedule"
              value={cronSchedule}
              onChange={(e) => setCronSchedule(e.target.value)}
              placeholder="*/5 * * * *"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use cron syntax (e.g. "*/5 * * * *" for every 5 minutes)
            </p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Schedule Task
          </button>
        </form>
      </div>
    );
  },
});
