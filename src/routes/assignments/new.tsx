import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { getCurrentUser } from "@/utils/auth";

export const Route = createFileRoute("/assignments/new")({
  component: () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const assignees = useQuery(
      api.assignees.list,
      user?._id ? { userId: user._id } : "skip",
    );
    // @ts-ignore: assignments may not be in the generated API until convex dev is run
    const createAssignment = useMutation(api.assignments?.create);

    const [selectedAssignee, setSelectedAssignee] = useState<
      Id<"assignees"> | ""
    >("");
    const [title, setTitle] = useState("");
    const [cronSchedule, setCronSchedule] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedAssignee && title.trim() && cronSchedule.trim()) {
        try {
          await createAssignment({
            assigneeId: selectedAssignee,
            title: title.trim(),
            cronSchedule: cronSchedule.trim(),
          });
          navigate({ to: "/assignments" });
        } catch (error) {
          if (error instanceof Error) {
            alert(
              "You cannot schedule the same task for the same assignee twice",
            );
          } else {
            alert("An unexpected error occurred");
          }
        }
      }
    };

    if (!user) {
      return <div>Loading user...</div>;
    }

    if (assignees === undefined) {
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
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Task Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label
              htmlFor="cronSchedule"
              className="block text-sm font-medium text-gray-700"
            >
              Schedule (cron format)
            </label>
            <input
              type="text"
              id="cronSchedule"
              value={cronSchedule}
              onChange={(e) => setCronSchedule(e.target.value)}
              placeholder="* * * * *"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Assignment
          </button>
        </form>
      </div>
    );
  },
});
