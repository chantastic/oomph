import { mutation } from "./_generated/server";

// Helper function to check if an assignment should appear on a specific date
function shouldShowAssignmentOnDate(cronSchedule: string, date: Date): boolean {
  // Evaluate whether a given date is included by a cron expression.
  // We only consider month/day-of-month/day-of-week so that any time on that day counts.

  const lower = cronSchedule.trim().toLowerCase();

  // Support common macros and friendly aliases
  const macroMap: Record<string, string> = {
    "@yearly": "0 0 1 1 *",
    "@annually": "0 0 1 1 *",
    "@monthly": "0 0 1 * *",
    "@weekly": "0 0 * * 0",
    "@daily": "0 0 * * *",
    "@midnight": "0 0 * * *",
    "@hourly": "0 * * * *",
    "@weekday": "0 0 * * 1-5",
    daily: "0 0 * * *",
    weekly: "0 0 * * 0",
    monthly: "0 0 1 * *",
  };

  const normalized = macroMap[lower] ?? lower;

  // Some crons include seconds (6 fields). If so, ignore seconds.
  const parts = normalized.split(/\s+/).filter(Boolean);
  const fields = parts.length === 6 ? parts.slice(1) : parts;
  if (fields.length !== 5) {
    // Unknown format – default to showing (fail-open for visibility)
    return true;
  }

  // Fields: minute hour dayOfMonth month dayOfWeek
  const [, , /*minute*/ /*hour*/ dom, mon, dow] = fields;

  // Month mapping for names
  const monthNameToNumber: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  // Day-of-week mapping for names (0 or 7 is Sunday)
  const dowNameToNumber: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  function parseListRangeStep(
    field: string,
    min: number,
    max: number,
    nameMap?: Record<string, number>,
    normalize?: (n: number) => number
  ): (value: number) => boolean {
    if (field === "*") return () => true;

    const segments = field.split(",");

    const allowed: number[] = [];
    for (const seg of segments) {
      const [rangePart, stepPart] = seg.split("/");
      const step = stepPart ? Math.max(1, parseInt(stepPart, 10)) : 1;

      const resolveToken = (token: string): number | null => {
        const t = token.trim().toLowerCase();
        if (t === "*") return null;
        if (nameMap && t in nameMap) return nameMap[t];
        const n = parseInt(t, 10);
        if (!isNaN(n)) return n;
        return null;
      };

      if (rangePart.includes("-")) {
        const [aTok, bTok] = rangePart.split("-");
        const aRaw = resolveToken(aTok);
        const bRaw = resolveToken(bTok);
        if (aRaw == null || bRaw == null) continue;
        const a = Math.max(min, Math.min(max, aRaw));
        const b = Math.max(min, Math.min(max, bRaw));
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        for (let v = start; v <= end; v += step) {
          allowed.push(normalize ? normalize(v) : v);
        }
      } else if (rangePart === "*") {
        for (let v = min; v <= max; v += step) {
          allowed.push(normalize ? normalize(v) : v);
        }
      } else {
        const single = resolveToken(rangePart);
        if (single != null) {
          const v = Math.max(min, Math.min(max, single));
          if ((v - min) % step === 0) {
            allowed.push(normalize ? normalize(v) : v);
          }
        }
      }
    }

    const set = new Set(allowed);
    return (value: number) => set.has(normalize ? normalize(value) : value);
  }

  const jsMonth = date.getMonth() + 1; // 1-12
  const jsDom = date.getDate(); // 1-31
  const jsDow = date.getDay(); // 0-6, Sunday=0

  // Month matcher
  const monthMatches = parseListRangeStep(mon, 1, 12, monthNameToNumber);
  const isMonthOk = monthMatches(jsMonth);
  if (!isMonthOk) return false;

  // Day-of-month matcher
  const domMatches = parseListRangeStep(dom, 1, 31);
  const domIsAny = dom === "*";
  const domOk = domMatches(jsDom);

  // Day-of-week matcher (accept 0 or 7 for Sunday and names)
  const dowMatches = parseListRangeStep(dow, 0, 7, dowNameToNumber, (n) =>
    n === 7 ? 0 : n
  );
  const dowIsAny = dow === "*";
  const dowOk = dowMatches(jsDow);

  // Vixie cron semantics: if both DOM and DOW are restricted (not *), match if EITHER matches.
  // If one is '*', the other controls.
  if (!domIsAny && !dowIsAny) {
    return domOk || dowOk;
  }
  if (!domIsAny) return domOk;
  if (!dowIsAny) return dowOk;
  return true;
}

// Materialize assignments for all assignees with optimized batching
export const materializeAssignmentsForAssignees = mutation({
  args: {},
  handler: async (ctx) => {
    // Get current time in LA timezone
    const nowUtc = new Date();
    const laFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = laFormatter.formatToParts(nowUtc);
    const laYear = parseInt(parts.find((p) => p.type === "year")!.value);
    const laMonth = parseInt(parts.find((p) => p.type === "month")!.value);
    const laDay = parseInt(parts.find((p) => p.type === "day")!.value);

    // Create a Date object representing "today" in LA for cron schedule evaluation
    const today = new Date(laYear, laMonth - 1, laDay);

    // Calculate the UTC timestamps that correspond to midnight-to-midnight in LA
    // Use a simple approach: create a date at midnight LA time and get its UTC equivalent
    const midnightLA = new Date(laYear, laMonth - 1, laDay, 0, 0, 0, 0);
    const nextMidnightLA = new Date(laYear, laMonth - 1, laDay + 1, 0, 0, 0, 0);
    
    // Get the timezone offset for LA on this date by comparing a known UTC time with its LA equivalent
    const testUTC = new Date(laYear, laMonth - 1, laDay, 12, 0, 0, 0);
    const testLAString = testUTC.toLocaleString("en-US", { 
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      hour12: false 
    });
    const testLAHour = parseInt(testLAString);
    const testUTCHour = testUTC.getUTCHours();
    const offsetHours = testUTCHour - testLAHour;
    
    // Calculate midnight in LA as UTC timestamp
    const todayStartUTCms = Date.UTC(laYear, laMonth - 1, laDay, offsetHours, 0, 0, 0);
    const todayEndUTCms = todayStartUTCms + 24 * 60 * 60 * 1000 - 1;

    // Batch 1: Get all assignees and all assignment descriptors in parallel
    const [assignees, allAssignmentDescriptors] = await Promise.all([
      ctx.db.query("assignee").collect(),
      ctx.db.query("assignee_assignment_descriptor").collect(),
    ]);

    // Batch 2: Get today's existing assignments for all assignees in one query
    // Query for assignments created between midnight and 11:59:59.999pm LA time (expressed as UTC timestamps)
    const todaysExistingAssignments = await ctx.db
      .query("assignee_assignment")
      .filter((q) =>
        q.and(
          q.gte(q.field("_creationTime"), todayStartUTCms),
          q.lte(q.field("_creationTime"), todayEndUTCms)
        )
      )
      .collect();

    // Create lookup maps for efficient checking
    const existingAssignmentsByAssignee = new Map<string, Map<string, any>>();
    for (const existing of todaysExistingAssignments) {
      if (!existingAssignmentsByAssignee.has(existing.assigneeId)) {
        existingAssignmentsByAssignee.set(existing.assigneeId, new Map());
      }
      existingAssignmentsByAssignee
        .get(existing.assigneeId)!
        .set(existing.title, existing);
    }

    const assignmentDescriptorsByAssignee = new Map<string, any[]>();
    for (const descriptor of allAssignmentDescriptors) {
      if (!assignmentDescriptorsByAssignee.has(descriptor.assigneeId)) {
        assignmentDescriptorsByAssignee.set(descriptor.assigneeId, []);
      }
      assignmentDescriptorsByAssignee
        .get(descriptor.assigneeId)!
        .push(descriptor);
    }

    const results = [];
    let totalMaterialized = 0;

    // Process each assignee
    for (const assignee of assignees) {
      const assigneeId = assignee._id;
      const assignmentDescriptors =
        assignmentDescriptorsByAssignee.get(assigneeId) || [];
      const existingAssignments =
        existingAssignmentsByAssignee.get(assigneeId) || new Map();

      const materialized = [];

      for (const assignment of assignmentDescriptors) {
        // Check if this assignment should be materialized for today
        if (shouldShowAssignmentOnDate(assignment.cronSchedule, today)) {
          // Check if already materialized today (by title match) - now O(1) lookup
          if (!existingAssignments.has(assignment.title)) {
            // Create assignee assignment
            const assigneeAssignmentId = await ctx.db.insert(
              "assignee_assignment",
              {
                assigneeId,
                title: assignment.title,
                description: assignment.description,
              }
            );

            materialized.push({
              id: assigneeAssignmentId,
              title: assignment.title,
              description: assignment.description,
            });
          }
        }
      }

      totalMaterialized += materialized.length;

      results.push({
        assigneeId: assignee._id,
        assigneeName: assignee.name,
        materialized,
        count: materialized.length,
      });
    }

    return {
      results,
      totalMaterialized,
    };
  },
});
