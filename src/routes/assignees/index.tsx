import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getCurrentUser } from "../../utils/auth";

export const Route = createFileRoute("/assignees/")({
  component: () => {
    const user = getCurrentUser();
    const assignees = useQuery(
      api.assignees.list,
      user?._id ? { userId: user._id } : "skip",
    );

    if (!user) {
      return <div>Loading user...</div>;
    }

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
                <Link
                  to="/week/assignee/$assignee_id"
                  params={{ assignee_id: assignee._id }}
                  className="text-lg text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {assignee.name}
                </Link>
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
