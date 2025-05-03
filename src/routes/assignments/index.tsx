import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatRelative } from "date-fns";
import { getCurrentUser } from "@/utils/auth";

export const Route = createFileRoute("/assignments/")({
  component: AssignmentList,
});

function AssignmentList() {
  const user = getCurrentUser();

  // @ts-expect-error: assignments may not be in the generated API until convex dev is run
  const assignments = useQuery(
    api.assignments?.list,
    user?._id ? { userId: user._id } : "skip",
  );

  if (assignments === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Scheduled Tasks</h1>
        <Link
          to="/assignments/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Schedule New Task
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No scheduled tasks yet.</p>
          <Link
            to="/assignments/new"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Create your first scheduled task
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment: any) => (
                <tr key={assignment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.assignee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {assignment.cronSchedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRelative(assignment._creationTime, new Date())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
