import {
  createFileRoute,
  Outlet,
  useParams,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Calendar, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/assignee/_layout")({
  component: AssigneeLayout,
});

function AssigneeLayout() {
  const { assignee_id } = useParams({ from: "/assignee/$assignee_id" });
  const assignee = useQuery(api.assignees.list, undefined)?.find(
    (a) => a._id === assignee_id,
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {assignee ? assignee.name : "Assignee"}
          </h1>
        </div>
        <nav className="flex gap-4">
          <Link
            to="/assignee/$assignee_id/"
            params={{ assignee_id }}
            className="text-blue-600 hover:underline flex items-center gap-1"
            aria-label="Day view"
          >
            <Calendar size={20} />
          </Link>
          <Link
            to="/assignee/$assignee_id/week"
            params={{ assignee_id }}
            className="text-blue-600 hover:underline flex items-center gap-1"
            aria-label="Week view"
          >
            <CalendarDays size={20} />
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
