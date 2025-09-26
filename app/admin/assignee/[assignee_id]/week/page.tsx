"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddAssignmentForm } from "@/components/add-assignment-form";
import { getWeekDates, isToday, shouldShowAssignmentOnDate } from "@/lib/utils";
import { useMemo } from "react";
import { buildDayLookup, toggleCompletion } from "@/lib/completions";

export default function WeekViewPage() {
  const params = useParams();
  const assigneeId = params.assignee_id as Id<"assignees">;

  const assignee = useQuery(api.assignments.getAssignee, { assigneeId });
  const assignments = useQuery(api.assignments.getByAssignee, { assigneeId });

  // Read weekOffset from the URL search params so the date range is shareable.
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawWeekOffset = searchParams.get("weekOffset");
  const currentWeekOffset = rawWeekOffset ? parseInt(rawWeekOffset, 10) : 0;
  const weekDates = getWeekDates(
    new Date(Date.now() + currentWeekOffset * 7 * 24 * 60 * 60 * 1000)
  );

  // Compute start/end ms for the week and fetch JIT assignments for each day
  const startOfWeek = new Date(weekDates[0]);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(weekDates[6]);
  endOfWeek.setHours(23, 59, 59, 999);

  const visibleAssignments = assignments
    ? assignments.filter((a: any) =>
        weekDates.some((date) =>
          shouldShowAssignmentOnDate(a.cronSchedule, date)
        )
      )
    : [];

  // Get JIT assignments for the week
  const jitAssignmentsForWeek = useQuery(api.assignments.getJitAssignmentsForAssigneeBetween, {
    assigneeId,
    startMs: startOfWeek.getTime(),
    endMs: endOfWeek.getTime(),
  });

  const completions = useQuery(
    api.assignments.getCompletionsForAssigneeBetween,
    {
      assigneeId,
      startMs: startOfWeek.getTime(),
      endMs: endOfWeek.getTime(),
    }
  );

  const dayLookup = useMemo(() => {
    return completions ? buildDayLookup(completions) : new Map();
  }, [completions]);

  const createCompletion = useMutation(api.assignments.createCompletion);
  const deleteCompletion = useMutation(api.assignments.deleteCompletion);
  const deleteCompletionById = useMutation(api.assignments.deleteCompletionById);

  // Helper function to get day name
  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  if (!assignee) {
    return (
      <main className="flex min-h-screen flex-col items-center p-24">
        <div className="w-full max-w-6xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4 justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Back to Assignees
              </Button>
            </Link>
            <div className="flex gap-2">
              <Link href={`/admin/assignee/${assigneeId}`}>
                <Button variant="outline" size="sm">
                  Today
                </Button>
              </Link>
              <Button size="sm" disabled>
                Week View
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold mb-2">{assignee.name}</h1>

            {/* Week Navigation */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const params = new URLSearchParams(Array.from(searchParams.entries()));
                params.set("weekOffset", "0");
                router.replace(`?${params.toString()}`);
              }}>
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(Array.from(searchParams.entries()));
                  params.set("weekOffset", String(currentWeekOffset - 1));
                  router.replace(`?${params.toString()}`);
                }}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(Array.from(searchParams.entries()));
                  params.set("weekOffset", String(currentWeekOffset + 1));
                  router.replace(`?${params.toString()}`);
                }}
              >
                →
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {weekDates[0].toLocaleDateString("en-US", { month: "long" })}{" "}
                {weekDates[0].getDate()} - {weekDates[6].getDate()}
              </h2>
              <div className="text-sm text-muted-foreground">
                {assignments
                  ? `${assignments.length} total assignment${
                      assignments.length !== 1 ? "s" : ""
                    }`
                  : "Loading..."}
              </div>
            </div>

            <AddAssignmentForm
              assigneeId={assigneeId}
              onSuccess={() => {
                // This will trigger a re-fetch of assignments
                // since Convex automatically updates the UI
              }}
            />

            <div className="mt-6">
              {(assignments && assignments.length > 0) || (jitAssignmentsForWeek && jitAssignmentsForWeek.length > 0) ? (
                <div className="overflow-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-3 py-2 text-left align-middle">
                          Task
                        </th>
                        {weekDates.map((date, i) => (
                          <th
                            key={i}
                            className="border px-3 py-2 text-center align-middle leading-tight"
                          >
                            <div className="text-sm text-gray-600">
                              {getDayName(date)}
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                isToday(date)
                                  ? "text-blue-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {date.getDate()}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* JIT Assignments */}
                      {jitAssignmentsForWeek && jitAssignmentsForWeek.map((assignment: any) => (
                        <tr key={`jit-${assignment._id}`} className="hover:bg-blue-50">
                          <td
                            className="border px-3 py-2 align-top w-48 leading-tight"
                            style={{ lineHeight: "1.25rem" }}
                          >
                            <div className="font-medium leading-tight">
                              {assignment.title}
                            </div>
                          </td>
                          {weekDates.map((date, idx) => {
                            // JIT assignments only show on their specific date
                            const jitDate = new Date(assignment.date);
                            const isJitDate = jitDate.toDateString() === date.toDateString();
                            
                            // Find completion for this JIT assignment on this date
                            let matchingCompletion: any = undefined;
                            if (completions) {
                              const startOfDay = new Date(date);
                              startOfDay.setHours(0, 0, 0, 0);
                              const key = `${assignment._id.toString()}-${startOfDay.getTime()}`;
                              matchingCompletion = dayLookup.get(key);
                            }
                            const completed = !!matchingCompletion;
                            
                            return (
                              <td
                                key={idx}
                                className="border px-3 py-2 text-center align-top h-14 leading-tight"
                                onClick={async () => {
                                  if (!isJitDate) return;
                                  try {
                                    await toggleCompletion(
                                      { createCompletion, deleteCompletion, deleteCompletionById },
                                      assignment._id,
                                      "jit",
                                      date,
                                      matchingCompletion
                                    );
                                  } catch (err) {
                                    console.error("Failed to toggle JIT completion", err);
                                  }
                                }}
                              >
                                {isJitDate ? (
                                  <div className="leading-tight">
                                    {completions ? (
                                      completed ? (
                                        <span className="text-green-600 font-medium">
                                          Completed
                                        </span>
                                      ) : (
                                        <span className="text-red-500">
                                          Incomplete
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-gray-500">
                                        Loading…
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="text-xs text-muted-foreground h-full w-full flex items-center justify-center text-gray-300 pointer-events-none"
                                    style={{
                                      backgroundImage:
                                        "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 8px)",
                                    }}
                                  >
                                    —
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      
                      {/* Cron Assignments */}
                      {visibleAssignments.map((assignment: any) => (
                        <tr key={assignment._id} className="hover:bg-gray-50">
                          <td
                            className="border px-3 py-2 align-top w-48 leading-tight"
                            style={{ lineHeight: "1.25rem" }}
                          >
                            <div className="font-medium leading-tight">
                              {assignment.title}
                            </div>
                            {assignment.description && (
                              <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                                {assignment.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {assignment.cronSchedule}
                            </div>
                          </td>
                          {weekDates.map((date, idx) => {
                            const visible = shouldShowAssignmentOnDate(
                              assignment.cronSchedule,
                              date
                            );
                            // find if completion exists for that assignment on that date
                            let matchingCompletion: any = undefined;
                            if (completions) {
                              const startOfDay = new Date(date);
                              startOfDay.setHours(0, 0, 0, 0);
                              const key = `${assignment._id.toString()}-${startOfDay.getTime()}`;
                              matchingCompletion = dayLookup.get(key);
                            }
                            const completed = !!matchingCompletion;
                            return (
                              <td
                                key={idx}
                                className="border px-3 py-2 text-center align-top h-14 leading-tight"
                                onClick={async () => {
                                  if (!visible) return;
                                  try {
                                    await toggleCompletion(
                                      { createCompletion, deleteCompletion, deleteCompletionById },
                                      assignment._id,
                                      "cron",
                                      date,
                                      matchingCompletion
                                    );
                                  } catch (err) {
                                    console.error("Failed to toggle completion", err);
                                  }
                                }}
                              >
                                {visible ? (
                                  <div className="leading-tight">
                                    {completions ? (
                                      completed ? (
                                        <span className="text-green-600 font-medium">
                                          Completed
                                        </span>
                                      ) : (
                                        <span className="text-red-500">
                                          Incomplete
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-gray-500">
                                        Loading…
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="text-xs text-muted-foreground h-full w-full flex items-center justify-center text-gray-300 pointer-events-none"
                                    style={{
                                      backgroundImage:
                                        "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 8px)",
                                    }}
                                  >
                                    —
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No assignments found for this assignee this week.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
