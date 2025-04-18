import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../../ui/button";

function TasksIndex() {
  const tasks = useQuery(api.tasks.list);
  const createCompletion = useMutation(api.taskCompletions.createCompletion);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      <Link
        to="/tasks/new"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        Add New Task
      </Link>

      <div className="space-y-4">
        {tasks?.map((task) => (
          <div
            key={task._id}
            className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="text-lg">{task.title}</p>
              <p className="text-sm text-gray-500">
                Created: {new Date(task._creationTime).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={() => createCompletion({ taskId: task._id })}>
              Complete
            </Button>
          </div>
        ))}
        {tasks?.length === 0 && (
          <p className="text-center text-gray-500">
            No tasks yet. Create one above!
          </p>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/tasks/")({
  component: TasksIndex,
});
