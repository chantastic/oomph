import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/assignees/")({
  component: () => {
    const assignees = useQuery(api.assignees.list);

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Available Assignees</h1>

        <Link
          to="/assignees/new"
          className="mb-4 inline-block text-blue-600 hover:underline"
        >
          Add New Assignee
        </Link>

        <div className="space-y-4">
          {assignees?.map((assignee) => (
            <div
              key={assignee._id}
              className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg">{assignee.name}</p>
                <p className="text-sm text-gray-500">
                  Created:{" "}
                  {new Date(assignee._creationTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {assignees?.length === 0 && (
            <p className="text-center text-gray-500">
              No assignees available yet.
            </p>
          )}
        </div>
      </div>
    );
  },
});
