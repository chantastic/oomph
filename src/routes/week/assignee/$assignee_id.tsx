import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useMemo, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../ui/dialog";
import { cn } from "../../../utils/misc";

// Helper function to check if a cron schedule includes a specific day of week
function isDayScheduled(cronSchedule: string, dayOfWeek: number): boolean {
  try {
    // Extract day of week field (last field in cron expression)
    const [, , , , dayField] = cronSchedule.split(" ");
    if (dayField === "*") return true;
    const days = dayField.split(",").flatMap((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (start > end) {
          const range = [];
          for (let i = start; i <= 6; i++) range.push(i);
          for (let i = 0; i <= end; i++) range.push(i);
          return range;
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
          (d) => (d === 7 ? 0 : d),
        );
      }
      const day = Number(part);
      return [day === 7 ? 0 : day];
    });
    return days.includes(dayOfWeek);
  } catch (e) {
    console.error("Error parsing cron schedule:", e);
    return false;
  }
}

export const Route = createFileRoute("/week/assignee/$assignee_id")({
  component: AssigneeAdminWeekView,
});

function AssigneeAdminWeekView() {
  const { assignee_id } = useParams({ from: "/week/assignee/$assignee_id" });

  // Fetch assignee info
  const assignee = useQuery(
    api.assignees.getById,
    assignee_id ? { assigneeId: assignee_id as Id<"assignees"> } : "skip",
  );

  // Compute week start (Sunday) and date range for completions
  const today = new Date();
  const currentDow = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDow);
  const weekStart = new Date(
    sunday.getFullYear(),
    sunday.getMonth(),
    sunday.getDate(),
  );
  const dayMs = 24 * 60 * 60 * 1000;
  const weekStartEpoch = weekStart.getTime();
  const weekEndEpoch = weekStartEpoch + 6 * dayMs;

  const scheduledTasks = useQuery(
    api.assignments.listForAssigneeWeekView,
    assignee_id
      ? {
          assigneeId: assignee_id as Id<"assignees">,
          start: weekStartEpoch,
          end: weekEndEpoch,
        }
      : "skip",
  );

  // Fetch completions for this week
  const completions = useQuery(api.assignmentCompletions.getCompletions, {
    start: weekStartEpoch,
    end: weekEndEpoch,
  });
  const createCompletion = useMutation(
    api.assignmentCompletions.createCompletion,
  );
  const deleteCompletion = useMutation(
    api.assignmentCompletions.deleteCompletion,
  );

  // Admin task creation state and functionality
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const createAssignment = useMutation(api.assignments.create);
  const [submitting, setSubmitting] = useState(false);

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

  const days = useMemo(
    () => [
      { name: "Sunday", value: 0 },
      { name: "Monday", value: 1 },
      { name: "Tuesday", value: 2 },
      { name: "Wednesday", value: 3 },
      { name: "Thursday", value: 4 },
      { name: "Friday", value: 5 },
      { name: "Saturday", value: 6 },
    ],
    [],
  );

  // Helper to build cron string from selected days
  function buildCron(days: number[]): string {
    if (days.length === 0) return "* * * * *";
    return `* * * * ${days.sort().join(",")}`;
  }

  function handleDayToggle(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignee_id || !title.trim() || selectedDays.length === 0) return;
    setSubmitting(true);
    try {
      await createAssignment({
        assigneeId: assignee_id as Id<"assignees">,
        title: title.trim(),
        cronSchedule: buildCron(selectedDays),
      });
      setOpen(false);
      setTitle("");
      setSelectedDays([]);
    } catch (error) {
      alert("Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  }

  if (scheduledTasks === undefined) {
    return <div>Loading...</div>;
  }
  if (completions === undefined) {
    return <div>Loading completions...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        {assignee ? `${assignee.name} - Week View` : "Assignee Week View"}
      </h1>
      <div className="mb-4 flex items-center justify-between">
        <a
          href={`/assignee/${assignee_id}/week`}
          className="inline-block px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Go to Assignee View
        </a>
        <button
          className="px-3 py-1 rounded bg-green-600 text-white text-lg hover:bg-green-700 transition"
          onClick={() => setOpen(true)}
        >
          + Add Task
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Assignment for {assignee?.name}</DialogTitle>
            <DialogDescription>
              Create a new recurring assignment for this assignee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 rounded p-2"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weekdays</label>
              <div className="flex gap-2 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                  (label, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={cn(
                        "px-2 py-1 rounded border",
                        selectedDays.includes(idx)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                      )}
                      onClick={() => handleDayToggle(idx)}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
              <div className="text-xs text-gray-500">
                Selected:{" "}
                {selectedDays.length > 0
                  ? selectedDays
                      .map((d) => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d])
                      .join(", ")
                  : "None"}
                <br />
                Cron:{" "}
                <span className="font-mono">{buildCron(selectedDays)}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  submitting || !title.trim() || selectedDays.length === 0
                }
              >
                {submitting ? "Creating..." : "Create Assignment"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {scheduledTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">
            No assignments yet
          </h2>
          <p className="mb-6 text-gray-500 max-w-md">
            This assignee has no assignments for this week.
          </p>
          <button
            className="px-5 py-2 rounded bg-green-600 text-white text-base font-medium hover:bg-green-700 transition"
            onClick={() => setOpen(true)}
          >
            Add Assignment
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header row with days */}
            <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 mb-4">
              <div className="font-semibold">Task / Day</div>
              {days.map((day) => (
                <div
                  key={day.value}
                  className="font-semibold text-center min-w-[120px]"
                >
                  {day.name}
                </div>
              ))}
            </div>

            {/* Task rows */}
            {scheduledTasks.map((schedule: any) => (
              <div
                key={schedule._id}
                className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 mb-2"
              >
                {/* Task info */}
                <div className="pr-4">
                  <div className="font-medium">{schedule.title}</div>
                  <div className="text-sm text-gray-500">
                    {schedule.assignee.name}
                  </div>
                </div>

                {/* Day cells */}
                {days.map((day) => {
                  const isScheduled = isDayScheduled(
                    schedule.cronSchedule,
                    day.value,
                  );
                  // Calculate date for this cell
                  const dateStart = weekStartEpoch + day.value * dayMs;
                  const key = `${schedule._id}-${dateStart}`;
                  const completion = completionMap.get(key);
                  const isCompleted = Boolean(completion);
                  // Determine cell styles and label
                  let bgClass = "bg-gray-50 text-gray-400";
                  let label = "—";
                  if (isCompleted) {
                    bgClass = "bg-green-100 text-green-800";
                    label = "Completed";
                  } else if (isScheduled) {
                    bgClass = "bg-blue-100 text-blue-800";
                    label = "Scheduled";
                  }
                  return (
                    <div
                      key={day.value}
                      className={`min-h-[60px] rounded p-2 flex items-center justify-center ${bgClass} cursor-pointer hover:opacity-80`}
                      onClick={() => {
                        if (!isCompleted) {
                          createCompletion({
                            assignmentId: schedule._id,
                            completedAt: dateStart,
                          });
                        } else {
                          deleteCompletion({
                            completionId: completion._id,
                          });
                        }
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
