import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getCurrentUser } from "@/utils/auth";

export const Route = createFileRoute("/assignments/$documentId")({
  component: AssignmentShow,
});

function AssignmentShow() {
  const { documentId } = useParams({ from: "/assignments/$documentId" });

  const user = getCurrentUser();
  const assignments = useQuery(
    api.assignments?.list,
    user?._id ? { userId: user._id } : "skip",
  );

  if (!documentId) {
    return <div className="p-4">No assignment id provided.</div>;
  }
  if (assignments === undefined) {
    return <div className="p-4">Loading...</div>;
  }
  const assignment = assignments.find((a: any) => a._id === documentId);
  if (!assignment) {
    return <div className="p-4">Assignment not found.</div>;
  }
  const filtered = assignments.filter((a: any) => a.title === assignment.title);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Assignments for: {assignment.title}
      </h1>
      {filtered.length === 0 ? (
        <p className="text-gray-500">No assignments found for this task.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((a: any) => (
            <div key={a._id} className="p-4 bg-white rounded-lg shadow">
              <div className="font-medium">Assignee: {a.assignee.name}</div>
              <div className="text-sm text-gray-500">
                Schedule: <span className="font-mono">{a.cronSchedule}</span>
              </div>
              <div className="text-sm text-gray-500">
                Created: {new Date(a._creationTime).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
