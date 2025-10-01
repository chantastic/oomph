import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Schedule materialization to run hourly for testing
// This will help verify the fix works correctly
crons.cron(
  "Materialize Assignments for Assignees",
  "0 * * * *",
  api.system.materializeAssignmentsForAssignees
);

export default crons;