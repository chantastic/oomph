import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";

export function getCurrentUser() {
  // TODO: Should we use TanStack Query here?
  // eg, src/routes/_app/_auth/dashboard/_layout.tsx
  return useQuery(api.app.getCurrentUser, {});
}
