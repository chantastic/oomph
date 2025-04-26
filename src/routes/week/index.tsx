import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo } from "react";

// Helper function to check if a cron schedule includes a specific day of week
function isDayScheduled(cronSchedule: string, dayOfWeek: number): boolean {
  try {
    // Extract day of week field (last field in cron expression)
    const [, , , , dayField] = cronSchedule.split(" ");

    // Handle wildcard
    if (dayField === "*") return true;

    // Parse day field considering ranges and lists
    const days = dayField.split(",").flatMap((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        // Handle week wrap-around (e.g., "5-2" means "5,6,0,1,2")
        if (start > end) {
          const range = [];
          for (let i = start; i <= 6; i++) range.push(i);
          for (let i = 0; i <= end; i++) range.push(i);
          return range;
        }
        // Regular range
        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
          (d) => (d === 7 ? 0 : d),
        ); // Convert 7 to 0 for Sunday
      }
      // Single day
      const day = Number(part);
      return [day === 7 ? 0 : day]; // Convert 7 to 0 for Sunday
    });

    return days.includes(dayOfWeek);
  } catch (e) {
    console.error("Error parsing cron schedule:", e);
    return false;
  }
}

export const Route = createFileRoute("/week/")({
  component: WeekView,
});

function WeekView() {
  // @ts-ignore: assignments may not be in the generated API until convex dev is run
  const scheduledTasks = useQuery(api.assignments?.list);
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

  if (scheduledTasks === undefined) {
    return <div>Loading...</div>;
  }
  if (completions === undefined) {
    return <div>Loading completions...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Week View</h1>

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
                <div className="font-medium">{schedule.task.title}</div>
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

          {scheduledTasks.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No scheduled tasks yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
