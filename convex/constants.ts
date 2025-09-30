// Status constants for assignee assignments
export const ASSIGNMENT_STATUS = {
  COMPLETE: "complete",
  INCOMPLETE: undefined, // No status means incomplete
} as const;

export type AssignmentStatus = typeof ASSIGNMENT_STATUS[keyof typeof ASSIGNMENT_STATUS];
