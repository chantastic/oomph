import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/day/")({
  component: () => {
    const tasks = useQuery(api.tasks.list);

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Available Tasks</h1>

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
            </div>
          ))}
          {tasks?.length === 0 && (
            <p className="text-center text-gray-500">No tasks available yet.</p>
          )}
        </div>
      </div>
    );
  },
});
