"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { buildAssignmentLookup, toggleCompletion } from "@/lib/completions";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddAssignmentForm } from "@/components/add-assignment-form";
import { AddTimeAssignmentModal } from "@/components/add-time-assignment-modal";
import { shouldShowAssignmentOnDate } from "@/lib/utils";

export default function AssigneePage() {
  const params = useParams();
  const assigneeId = params.assignee_id as Id<"assignees">;
  
  const assignee = useQuery(api.assignments.getAssignee, { assigneeId });
  const assignments = useQuery(api.assignments.getByAssignee, { assigneeId });
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  const completions = useQuery(api.assignments.getCompletionsForAssigneeBetween, {
    assigneeId,
    startMs: startOfDay.getTime(),
    endMs: endOfDay.getTime(),
  });
  const jitAssignments = useQuery(api.assignments.getJitAssignmentsForAssigneeOnDate, {
    assigneeId,
    date: startOfDay.getTime(),
  });

  const createCompletion = useMutation(api.assignments.createCompletion);
  const deleteCompletion = useMutation(api.assignments.deleteCompletion);
  const deleteCompletionById = useMutation(api.assignments.deleteCompletionById);

  const assignmentLookup = useMemo(() => {
    return completions ? buildAssignmentLookup(completions) : new Map();
  }, [completions]);

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    const assigneeUrl = `${window.location.origin}/assignee/${assigneeId}`;

    try {
      setIsSharing(true);
      
      // Try native Web Share API first (works on mobile devices)
      if (navigator.share) {
        await navigator.share({ url: assigneeUrl });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(assigneeUrl);
        alert('URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(assigneeUrl);
        alert('URL copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard not available:', clipboardError);
        alert('Unable to share. Please copy the URL manually.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!assignee) {
    return (
      <main className="flex min-h-screen flex-col items-center p-24">
        <div className="w-full max-w-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Back to Assignees
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assignee.name}</h1>
              <p className="text-muted-foreground">Today</p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? 'Sharing...' : '📤 Share'}
              </Button>
              <Button size="sm" disabled>
                Today
              </Button>
              <Link href={`/admin/assignee/${assigneeId}/week`}>
                <Button variant="outline" size="sm">
                  Week View
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assignments</h2>
              <AddTimeAssignmentModal 
                assigneeId={assigneeId}
                onSuccess={() => {
                  // This will trigger a re-fetch of assignments
                  // since Convex automatically updates the UI
                }}
              />
            </div>
            
            <AddAssignmentForm 
              assigneeId={assigneeId} 
              onSuccess={() => {
                // This will trigger a re-fetch of assignments
                // since Convex automatically updates the UI
              }}
            />
            
            <div className="mt-6">
              {(() => {
                const today = new Date();
                const todaysAssignments = assignments ? assignments.filter(a =>
                  shouldShowAssignmentOnDate(a.cronSchedule, today)
                ) : [];
                
                const hasJitAssignments = jitAssignments && jitAssignments.length > 0;
                const hasRegularAssignments = todaysAssignments.length > 0;
                
                if (!hasJitAssignments && !hasRegularAssignments) {
                  return (
                    <div className="text-center text-muted-foreground py-8">
                      No assignments scheduled for today.
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {/* JIT assignments at the top */}
                    {hasJitAssignments && (
                      <div className="space-y-3">
                        {jitAssignments.map((assignment) => {
                          const matchingCompletion = assignmentLookup.get(
                            assignment._id.toString()
                          );
                          const completed = !!matchingCompletion;
                          return (
                            <div
                              key={`jit-${assignment._id}`}
                              className={`p-4 border-2 rounded-lg cursor-pointer relative ${
                                completed 
                                  ? "border-green-200 bg-green-50" 
                                  : "border-blue-200 bg-blue-50"
                              }`}
                              onClick={async () => {
                                try {
                                  await toggleCompletion(
                                    { createCompletion, deleteCompletion, deleteCompletionById },
                                    assignment._id,
                                    "jit",
                                    startOfDay,
                                    matchingCompletion
                                  );
                                } catch (err) {
                                  console.error("Failed to toggle JIT completion", err);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                                    completed 
                                      ? "text-green-600 bg-green-100" 
                                      : "text-blue-600 bg-blue-100"
                                  }`}>
                                    JUST IN TIME
                                  </span>
                                </div>
                                <div className="flex-shrink-0">
                                  {completed ? (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              <h3 className={`font-medium mb-2 ${
                                completed ? "text-green-900" : "text-blue-900"
                              }`}>
                                {assignment.title}
                              </h3>
                              {assignment.description && (
                                <p className={`text-sm mb-2 whitespace-pre-line ${
                                  completed ? "text-green-700" : "text-blue-700"
                                }`}>
                                  {assignment.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Regular assignments */}
                    {hasRegularAssignments && (
                      <div className="space-y-4">
                        {todaysAssignments.map((assignment) => {
                          const matchingCompletion = assignmentLookup.get(
                            assignment._id.toString()
                          );
                          const completed = !!matchingCompletion;
                          return (
                            <div
                              key={assignment._id}
                              className={`p-4 border rounded-lg cursor-pointer ${
                                completed ? "bg-green-50" : "bg-white"
                              }`}
                              onClick={async () => {
                                try {
                                  await toggleCompletion(
                                    { createCompletion, deleteCompletion, deleteCompletionById },
                                    assignment._id,
                                    "cron",
                                    startOfDay,
                                    matchingCompletion
                                  );
                                } catch (err) {
                                  console.error("Failed to toggle completion", err);
                                }
                              }}
                            >
                              <h3 className="font-medium mb-2">{assignment.title}</h3>
                              {assignment.description && (
                                <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">
                                  {assignment.description}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Schedule: {assignment.cronSchedule}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
