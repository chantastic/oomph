import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

function NewTask() {
  const createTask = useMutation(api.tasks.create);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask({ title: newTaskTitle });
    setNewTaskTitle("");
    navigate({
      to: "/tasks",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <Input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter new task title..."
          className="flex-1"
        />
        <Button type="submit">Add Task</Button>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/tasks/new")({
  component: NewTask,
});
