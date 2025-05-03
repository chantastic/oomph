import { api } from "@cvx/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

export function getCurrentUser() {
  const { data: user } = useQuery(convexQuery(api.app.getCurrentUser, {}));

  return user;
}
