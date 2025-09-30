import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Schedule materialization to run daily at 1:00 AM Pacific Time
// This corresponds to 9:00 AM UTC (PST) or 8:00 AM UTC (PDT)
// We'll use 9:00 AM UTC to account for PST (standard time)
crons.daily(
  "task materialization",
  { hourUTC: 9, minuteUTC: 0 },
  api.assigneeAssignment.materializeForAllAssignees
);

export default crons;