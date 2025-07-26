"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AssigneePage() {
  const params = useParams();
  const assigneeId = params.assignee_id as Id<"assignees">;
  
  const assignee = useQuery(api.assignments.getAssignee, { assigneeId });
  const assignments = useQuery(api.assignments.getByAssignee, { assigneeId });

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
          <h1 className="text-3xl font-bold mb-2">{assignee.name}</h1>
          <p className="text-muted-foreground">Assignee Details</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Assignments</h2>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">{assignment.title}</h3>
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
      </div>
    </main>
  );
} 