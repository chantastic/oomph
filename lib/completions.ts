// Utilities for efficient completion lookups and toggling

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


