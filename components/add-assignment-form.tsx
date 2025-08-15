"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddAssignmentFormProps {
  assigneeId: Id<"assignees">;
  onSuccess?: () => void;
}

export function AddAssignmentForm({ assigneeId, onSuccess }: AddAssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [cronSchedule, setCronSchedule] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const createAssignment = useMutation(api.assignments.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !cronSchedule.trim()) {
      return;
    }

    try {
      await createAssignment({
        assigneeId,
        title: title.trim(),
        cronSchedule: cronSchedule.trim(),
      });
      
      // Reset form
      setTitle("");
      setCronSchedule("");
      setIsOpen(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        + Add Assignment
      </Button>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Assignment Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter assignment title"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="cronSchedule">Cron Schedule</Label>
          <Input
            id="cronSchedule"
            value={cronSchedule}
            onChange={(e) => setCronSchedule(e.target.value)}
            placeholder="e.g., 0 9 * * 1 (every Monday at 9 AM)"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use cron format: minute hour day month weekday
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Create Assignment
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
