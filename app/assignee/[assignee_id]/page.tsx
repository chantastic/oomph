"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useMemo } from "react";
import { buildAssignmentLookup, toggleCompletion } from "@/lib/completions";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { shouldShowAssignmentOnDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

  const createCompletion = useMutation(api.assignments.createCompletion);
  const deleteCompletion = useMutation(api.assignments.deleteCompletion);
  const deleteCompletionById = useMutation(api.assignments.deleteCompletionById);

  const assignmentLookup = useMemo(() => {
    return completions ? buildAssignmentLookup(completions) : new Map();
  }, [completions]);

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
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 lg:p-24">
      <div className="w-full max-w-2xl">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{assignee.name}</h1>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="mt-4 sm:mt-6">
              {assignments && assignments.length > 0 ? (
                (() => {
                  const today = new Date();
                  const todaysAssignments = assignments.filter(a =>
                    shouldShowAssignmentOnDate(a.cronSchedule, today)
                  );
                  
                  // Sort assignments: incomplete first, then completed
                  const sortedAssignments = todaysAssignments.sort((a, b) => {
                    const aCompleted = !!assignmentLookup.get(a._id.toString());
                    const bCompleted = !!assignmentLookup.get(b._id.toString());
                    
                    // If one is completed and the other isn't, incomplete comes first
                    if (aCompleted !== bCompleted) {
                      return aCompleted ? 1 : -1;
                    }
                    
                    // If both have the same completion status, maintain original order
                    return 0;
                  });
                  
                  return sortedAssignments.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      <AnimatePresence mode="popLayout">
                        {sortedAssignments.map((assignment, index) => {
                          const matchingCompletion = assignmentLookup.get(
                            assignment._id.toString()
                          );
                          const completed = !!matchingCompletion;
                          return (
                            <motion.div
                              key={assignment._id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                                layout: { duration: 0.4, ease: "easeInOut" }
                              }}
                              className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                                completed 
                                  ? "bg-green-50 border-green-200 hover:bg-green-100" 
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={async () => {
                                try {
                                  await toggleCompletion(
                                    { createCompletion, deleteCompletion, deleteCompletionById },
                                    assignment._id,
                                    startOfDay,
                                    matchingCompletion
                                  );
                                } catch (err) {
                                  console.error("Failed to toggle completion", err);
                                }
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-medium text-sm sm:text-base ${
                                    completed ? "text-green-800" : "text-gray-900"
                                  }`}>
                                    {assignment.title}
                                  </h3>
                                </div>
                                <div className="ml-3 sm:ml-4 flex-shrink-0">
                                  {completed ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <motion.svg 
                                        className="w-3 h-3 sm:w-4 sm:h-4 text-white" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, duration: 0.2 }}
                                      >
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </motion.svg>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-6 sm:py-8">
                      <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
                      <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No tasks for today!</h3>
                      <p className="text-sm sm:text-base">Enjoy your free time or check back tomorrow for new assignments.</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center text-muted-foreground py-6 sm:py-8">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
                  <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No assignments yet</h3>
                  <p className="text-sm sm:text-base">Your tasks will appear here once they're assigned to you.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
