import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { getCurrentUser } from "@/utils/auth";

export const Route = createFileRoute("/assignees/new")({
  component: () => {
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const createAssignee = useMutation(api.assignees.create);
    const navigate = useNavigate();
    const user = getCurrentUser();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?._id) return;
      if (name.trim()) {
        try {
          await createAssignee({ name, userId: user._id });
          setName("");
          setError(null);
          navigate({ to: "/assignees" });
        } catch (err: any) {
          if (err?.message?.includes("Not authenticated")) {
            setError("You must be logged in to create an assignee.");
          } else {
            setError("An unexpected error occurred.");
          }
        }
      }
    };

    if (!user) {
      return <div>Loading user...</div>;
    }

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Assignee</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Assignee Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Assignee
          </button>
        </form>
      </div>
    );
  },
});
