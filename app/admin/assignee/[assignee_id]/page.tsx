"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddAssignmentForm } from "@/components/add-assignment-form";
import { TaskLog } from "@/components/task-log";

export default function AssigneePage() {
  const params = useParams();
  const assigneeId = params.assignee_id as Id<"assignee">;
  
  const assignee = useQuery(api.assignee.getAssignee, { assigneeId });
  const assignments = useQuery(api.assigneeAssignmentDescriptor.getByAssignee, { assigneeId });
  
  // Assignee assignments
  const assigneeAssignments = useQuery(api.assigneeAssignment.getByAssignee, {
    assigneeId,
  });
  const materializeForToday = useMutation(api.assigneeAssignment.materializeForToday);

  const [isMaterializing, setIsMaterializing] = useState(false);


  const handleMaterialize = async () => {
    try {
      setIsMaterializing(true);
      const result = await materializeForToday({ assigneeId });
      console.log(`Materialized ${result.count} assignments:`, result.materialized);
      alert(`Successfully materialized ${result.count} assignments for today!`);
    } catch (error) {
      console.error("Failed to materialize assignments:", error);
      alert("Failed to materialize assignments. Check console for details.");
    } finally {
      setIsMaterializing(false);
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
              <p className="text-sm text-gray-600">Pacific Time (PT)</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/assignee/${assigneeId}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  🔗 Public Page
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleMaterialize}
                disabled={isMaterializing}
              >
                {isMaterializing ? 'Materializing...' : '🧪 Test Materialize'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assignments</h2>
            </div>
            
            <AddAssignmentForm 
              assigneeId={assigneeId} 
              onSuccess={() => {
                // This will trigger a re-fetch of assignments
                // since Convex automatically updates the UI
              }}
            />
            
            <div className="mt-6">
              {assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="p-4 border rounded-lg bg-white"
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
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No assignments found for this assignee.
                </div>
              )}
            </div>
          </div>

          {/* Task Log Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Task Log</h2>
              <div className="text-sm text-muted-foreground">
                {assigneeAssignments ? `${assigneeAssignments.length} tasks` : 'Loading...'}
              </div>
            </div>
            
            <div className="mt-4">
              {assigneeAssignments && assigneeAssignments.length > 0 ? (
                <TaskLog assigneeAssignments={assigneeAssignments} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No tasks yet. Use the "Test Materialize" button to create tasks for today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
