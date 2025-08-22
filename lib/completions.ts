// Utilities for efficient completion lookups and toggling
export function buildDayLookup(completions: any[]) {
  const map = new Map();
  for (const c of completions) {
    try {
      const assignmentId = c.assignmentId.toString();
      const d = new Date(c.time);
      d.setHours(0, 0, 0, 0);
      const key = `${assignmentId}-${d.getTime()}`;
      map.set(key, c);
    } catch (e) {
      // ignore malformed entries
    }
  }
  return map;
}

export function buildAssignmentLookup(completions: any[]) {
  const map = new Map();
  for (const c of completions) {
    try {
      map.set(c.assignmentId.toString(), c);
    } catch (e) {
      // ignore
    }
  }
  return map;
}

export async function toggleCompletion(
  mutations: any,
  assignmentId: any,
  date: any,
  matchingCompletion: any
) {
  const { createCompletion, deleteCompletion, deleteCompletionById } = mutations;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  if (matchingCompletion) {
    if (matchingCompletion._id) {
      await deleteCompletionById({ completionId: matchingCompletion._id });
    } else {
      await deleteCompletion({ assignmentId, time: startOfDay.getTime() });
    }
  } else {
    await createCompletion({ assignmentId, time: startOfDay.getTime() });
  }
}


