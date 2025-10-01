import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Schedule materialization to run daily at 9:00 AM UTC
// This corresponds to 1:00 AM PT (PST) or 2:00 AM PT (PDT)
// Consistent UTC time regardless of daylight saving time
crons.cron(
  "Materialize Assignments for Assignees",
  "0 9 * * *",
  api.system.materializeAssignmentsForAssignees
);

export default crons;