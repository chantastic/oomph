"use client";

import React, { useState } from "react";
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
import { Edit } from "lucide-react";

interface AddAssignmentFormProps {
  assigneeId: Id<"assignee">;
  onSuccess?: () => void;
  editingDescriptor?: {
    id: Id<"assignee_assignment_descriptor">;
    title: string;
    cronSchedule: string;
    description?: string;
  };
}

export function AddAssignmentForm({ assigneeId, onSuccess, editingDescriptor }: AddAssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  
  const upsertAssignment = useMutation(api.assigneeAssignmentDescriptor.upsert);

  // Parse cron schedule to selected days
  const parseCronToDays = (cronSchedule: string): Set<number> => {
    // Parse cron format: "0 1 * * 1,2,3" -> Set([1,2,3])
    const parts = cronSchedule.split(" ");
    if (parts.length >= 5) {
      const dayPart = parts[4];
      const days = dayPart.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d));
      return new Set(days);
    }
    return new Set();
  };

  // Initialize form fields when editing descriptor changes and dialog opens
  React.useEffect(() => {
    if (editingDescriptor && isOpen) {
      setTitle(editingDescriptor.title);
      setDescription(editingDescriptor.description || "");
      setSelectedDays(parseCronToDays(editingDescriptor.cronSchedule));
    } else if (!editingDescriptor && isOpen) {
      // Reset form when creating new assignment
      setTitle("");
      setDescription("");
      setSelectedDays(new Set());
    }
  }, [editingDescriptor, isOpen]);

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
      await upsertAssignment({
        id: editingDescriptor?.id,
        assigneeId,
        title: title.trim(),
        cronSchedule: generateCronSchedule(selectedDays),
        ...(description.trim() && { description: description.trim() }),
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedDays(new Set());
      setIsOpen(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Handle error silently
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
        <Button 
          className={editingDescriptor ? "flex items-center justify-center" : "flex items-center"}
          aria-label={editingDescriptor ? `Edit assignment: ${editingDescriptor.title}` : "Add new assignment"}
        >
          {editingDescriptor ? (
            <Edit className="h-4 w-4" />
          ) : (
            "Add Assignment"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingDescriptor ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
          <DialogDescription>
            {editingDescriptor ? "Edit the recurring assignment details." : "Create a recurring assignment for this assignee."}
          </DialogDescription>
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
            <Label htmlFor="description" className="text-base font-medium mb-3 block">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share context, steps, or links for this assignment (optional)"
              rows={4}
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
            <Button
              type="submit"
              className="flex-1 h-11"
              disabled={selectedDays.size === 0 || !title.trim()}
            >
              {editingDescriptor ? "Update Assignment" : "Create Assignment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setTitle("");
                setDescription("");
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
