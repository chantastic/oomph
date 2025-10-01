"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { ASSIGNMENT_STATUS } from "@/convex/constants";
import { Circle, CheckCircle2, Calendar } from "lucide-react";

interface AssignmentLogProps {
  assigneeAssignments: Array<{
    _id: Id<"assignee_assignment">;
    assigneeId: Id<"assignee">;
    title: string;
    description?: string;
    status?: "complete";
    _creationTime: number;
  }>;
}

type AssignmentStatus = "pending" | "complete";

const statusConfig = {
  pending: {
    icon: Circle,
    className: "text-gray-400 hover:text-gray-600 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors",
  },
  complete: {
    icon: CheckCircle2,
    className: "text-white bg-green-500 hover:bg-green-600 border-0 transition-colors",
  },
};

export function AssignmentLog({ assigneeAssignments }: AssignmentLogProps) {
  const updateStatus = useMutation(api.assigneeAssignment.upsert);

  const groupedByDay = useMemo(() => {
    const now = new Date();
    const groups: Record<string, typeof assigneeAssignments> = {};
    
    // Create groups for the last 7 days (current + previous 6)
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      groups[dateKey] = [];
    }

    // Group assignments by day
    assigneeAssignments.forEach((assignment) => {
      const assignmentDate = new Date(assignment._creationTime);
      const dateKey = assignmentDate.toISOString().split('T')[0];
      
      if (groups[dateKey]) {
        groups[dateKey].push(assignment);
      }
    });

    // Sort assignments within each day by creation time (newest first)
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => b._creationTime - a._creationTime);
    });

    return groups;
  }, [assigneeAssignments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const toggleStatus = async (assignment: typeof assigneeAssignments[0]) => {
    try {
      if (assignment.status === ASSIGNMENT_STATUS.COMPLETE) {
        await updateStatus({ 
          id: assignment._id,
          assigneeId: assignment.assigneeId,
          title: assignment.title,
          description: assignment.description,
          status: ASSIGNMENT_STATUS.INCOMPLETE 
        });
      } else {
        await updateStatus({ 
          id: assignment._id,
          assigneeId: assignment.assigneeId,
          title: assignment.title,
          description: assignment.description,
          status: ASSIGNMENT_STATUS.COMPLETE 
        });
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const getNextStatus = (currentStatus?: "complete"): AssignmentStatus => {
    return currentStatus === ASSIGNMENT_STATUS.COMPLETE ? "pending" : "complete";
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDay)
        .sort(([a], [b]) => b.localeCompare(a)) // Sort days newest first
        .map(([dateKey, assignments]) => (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">
                {formatDate(dateKey)}
              </h3>
              <div className="flex-1 h-px bg-gray-200"></div>
              {assignments.length > 0 && (
                <span className="text-xs text-gray-500">
                  {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {assignments.length > 0 ? (
              <div className="space-y-2 pl-4">
                {assignments.map((assignment) => {
                  const currentStatus: AssignmentStatus = assignment.status === ASSIGNMENT_STATUS.COMPLETE ? "complete" : "pending";
                  const nextStatus = getNextStatus(assignment.status);
                  const config = statusConfig[currentStatus];
                  const IconComponent = config.icon;
                  
                  return (
                    <div
                      key={assignment._id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <button
                        className={`h-6 w-6 rounded-full flex items-center justify-center aspect-square ${config.className}`}
                        onClick={() => toggleStatus(assignment)}
                        title={`Mark as ${nextStatus}`}
                        style={{ minWidth: '1.5rem', minHeight: '1.5rem' }}
                      >
                        <IconComponent className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {assignment.title}
                        </div>
                        {assignment.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {assignment.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic py-2 text-center">
                No assignments for this day
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
