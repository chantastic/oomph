import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrentUser } from "@/utils/auth";

function TasksIndex() {
  // TODO: Should we use TanStack Query here?
  // eg, src/routes/_app/_auth/dashboard/_layout.tsx
  const user = getCurrentUser();
  const uniqueTitles = useQuery(api.assignments.listUniqueTitles);
  const assignments = useQuery(
    api.assignments.list,
    user?._id ? { userId: user._id } : "skip",
  );

  // Map title to first assignmentId for linking
  const titleToId: Record<string, string> = {};
  if (assignments) {
    for (const a of assignments) {
      if (!titleToId[a.title]) {
        titleToId[a.title] = a._id;
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      <Link
        to="/assignments/new"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        Add New Task (via Assignments)
      </Link>
      <div className="space-y-4">
        {uniqueTitles === undefined ? (
          <div>Loading...</div>
        ) : uniqueTitles.length === 0 ? (
          <p className="text-center text-gray-500">
            No tasks yet. Create one above!
          </p>
        ) : (
          uniqueTitles.map((item) => (
            <div
              key={item.title}
              className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <Link
                  to={
                    titleToId[item.title]
                      ? `/assignments/${titleToId[item.title]}`
                      : "#"
                  }
                  className="text-lg text-blue-700 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-gray-500">
                  Created: {new Date(item._creationTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/tasks/")({
  component: TasksIndex,
});
