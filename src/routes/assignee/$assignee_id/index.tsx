import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useMemo } from "react";
import { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/assignee/$assignee_id/")({
  component: AssigneeDayView,
});

function AssigneeDayView() {
  const { assignee_id } = useParams({ from: "/assignee/$assignee_id/" });

  // Fetch assignee info
  const assignee = useQuery(
    api.assignees.getById,
    assignee_id ? { assigneeId: assignee_id as Id<"assignees"> } : "skip",
  );

  // Compute start of today (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayEpoch = today.getTime();

  // Fetch assignments for this assignee and day
  const assignments = useQuery(
    api.assignments.listForAssigneeDayView,
    assignee_id
      ? {
          assigneeId: assignee_id as Id<"assignees">,
          dayEpoch,
        }
      : "skip",
  );

  // Fetch completions for today
  const completions = useQuery(api.assignmentCompletions.getCompletions, {
    start: dayEpoch,
    end: dayEpoch,
  });
  const createCompletion = useMutation(
    api.assignmentCompletions.createCompletion,
  );
  const deleteCompletion = useMutation(
    api.assignmentCompletions.deleteCompletion,
  );

  // Map completions by assignmentId and day
  const completionMap = useMemo(() => {
    const map = new Map();
    if (completions) {
      for (const c of completions) {
        const key = `${c.assignmentId}-${c.completedAt}`;
        map.set(key, c);
      }
    }
    return map;
  }, [completions]);

  if (assignments === undefined) {
    return <div>Loading...</div>;
  }
  if (completions === undefined) {
    return <div>Loading completions...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        {assignee ? assignee.name : "Assignee"}
      </h1>
      <div className="mb-4">
        <a
          href={`/assignee/${assignee_id}/week`}
          className="inline-block px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Go to Week View
        </a>
      </div>
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">
            No assignments for today
          </h2>
        </div>
      ) : (
        <ul className="space-y-4">
          {assignments.map((assignment: any) => {
            const key = `${assignment._id}-${dayEpoch}`;
            const completion = completionMap.get(key);
            const isCompleted = Boolean(completion);
            return (
              <li
                key={assignment._id}
                className={`p-4 rounded border flex items-center justify-between ${
                  isCompleted
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
              >
                <div>
                  <div className="font-medium">{assignment.title}</div>
                  <div className="text-sm text-gray-500">
                    {assignment.assignee.name}
                  </div>
                </div>
                <button
                  className={`ml-4 px-3 py-1 rounded text-white ${
                    isCompleted ? "bg-green-600" : "bg-blue-600"
                  }`}
                  onClick={() => {
                    if (!isCompleted) {
                      createCompletion({
                        assignmentId: assignment._id,
                        completedAt: dayEpoch,
                      });
                    } else {
                      deleteCompletion({
                        completionId: completion._id,
                      });
                    }
                  }}
                >
                  {isCompleted ? "Completed" : "Mark Complete"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
