"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  
  const createAssignment = useMutation(api.assignments.create);

  // Generate cron schedule from selected days
  const generateCronSchedule = (days: Set<number>): string => {
    if (days.size === 0) return "";
    const sortedDays = Array.from(days).sort((a, b) => a - b);
    return `0 1 * * ${sortedDays.join(",")}`;
  };

  const toggleDay = (day: number) => {
    const newSelectedDays = new Set(selectedDays);
    if (newSelectedDays.has(day)) {
      newSelectedDays.delete(day);
    } else {
      newSelectedDays.add(day);
    }
    setSelectedDays(newSelectedDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || selectedDays.size === 0) {
      return;
    }

    try {
      await createAssignment({
        assigneeId,
        title: title.trim(),
        cronSchedule: generateCronSchedule(selectedDays),
      });
      
      // Reset form
      setTitle("");
      setSelectedDays(new Set());
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
    // Render the trigger when the dialog is closed via DialogTrigger
  }
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cronSchedule = generateCronSchedule(selectedDays);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">+ Add Assignment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
          <DialogDescription>Create a recurring assignment for this assignee.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <Label htmlFor="title" className="text-base font-medium mb-3 block">Assignment Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title"
              required
              className="h-11"
            />
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Schedule</Label>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {dayLabels.map((label, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedDays.has(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(index)}
                    className="min-w-[3.5rem] h-9 text-sm font-medium"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {cronSchedule && (
                <div className="p-3 bg-muted rounded text-sm font-mono border">
                  {cronSchedule}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Runs at 1 AM on selected days
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-11" disabled={selectedDays.size === 0}>
              Create Assignment
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSelectedDays(new Set());
              }}
              className="h-11 px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
