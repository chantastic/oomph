"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, Authenticated, Unauthenticated } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddAssignmentForm } from "@/components/add-assignment-form";
import { AssignmentLog } from "@/components/task-log";
import { cronToColloquial } from "@/lib/cron-parser";
import { ExternalLink } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuerySuspense } from "@/lib/useQuerySuspense";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading";

function AdminAssigneeContent({ assigneeId }: { assigneeId: Id<"assignee"> }) {
  const assignee = useQuerySuspense(api.assignee.find, { assigneeId });
  const assignments = useQuerySuspense(api.assigneeAssignmentDescriptor.getByAssignee, { assigneeId });
  const assigneeAssignments = useQuerySuspense(api.assigneeAssignment.getByAssignee, { assigneeId });

  return (
    <>
        <div className="mb-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Assignees</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{assignee.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assignee.name}</h1>
              <p className="text-sm text-gray-600">Pacific Time (PT)</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/assignee/${assigneeId}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  Public Page
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assignments</h2>
              <AddAssignmentForm 
                assigneeId={assigneeId} 
                onSuccess={() => {
                  // This will trigger a re-fetch of assignments
                  // since Convex automatically updates the UI
                }}
              />
            </div>
            
            <div className="mt-6">
              {assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment: any) => (
                    <div
                      key={assignment._id}
                      className="p-4 border rounded-lg bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-2">{assignment.title}</h3>
                          {assignment.description && (
                            <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">
                              {assignment.description}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Schedule: {cronToColloquial(assignment.cronSchedule)}
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <AddAssignmentForm
                            assigneeId={assigneeId}
                            editingDescriptor={{
                              id: assignment._id,
                              title: assignment.title,
                              cronSchedule: assignment.cronSchedule,
                              description: assignment.description,
                            }}
                            onSuccess={() => {
                              // This will trigger a re-fetch of assignments
                              // since Convex automatically updates the UI
                            }}
                          />
                        </div>
                      </div>
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

          {/* Assignment Log Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assignment Log</h2>
            </div>
            
            <div className="mt-4">
              {assigneeAssignments && assigneeAssignments.length > 0 ? (
                <AssignmentLog assigneeAssignments={assigneeAssignments} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No assignments yet.
                </div>
              )}
            </div>
           </div>
         </div>
    </>
  );
}

export default function AssigneePage() {
  const params = useParams();
  const assigneeId = params.assignee_id as Id<"assignee">;
  
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-2xl">
        <Unauthenticated>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view this page</h1>
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </div>
        </Unauthenticated>
        
        <Authenticated>
          <Suspense fallback={<LoadingSpinner />}>
            <AdminAssigneeContent assigneeId={assigneeId} />
          </Suspense>
        </Authenticated>
      </div>
    </main>
  );
}
