import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "../ui/logo";
import { cn } from "@/utils/misc";
import { buttonVariants } from "@/ui/button-util";
import { ThemeSwitcherHome } from "@/ui/theme-switcher";
import { useConvexAuth } from "@convex-dev/react-query";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Route as AuthLoginRoute } from "@/routes/_app/login/_layout.index";
import { Route as DashboardRoute } from "@/routes/_app/_auth/dashboard/_layout.index";
import { getCurrentUser } from "@/utils/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const currentUser = getCurrentUser();

  // For authenticated users, get their assignees
  const assignees = useQuery(
    api.assignees.list,
    isAuthenticated && currentUser ? { userId: currentUser._id } : "skip",
  );

  // Modal state for adding new assignee
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createAssignee = useMutation(api.assignees.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser) return;

    setSubmitting(true);
    setError(null);

    try {
      await createAssignee({ name: name.trim(), userId: currentUser._id });
      setName("");
      setOpen(false);
    } catch (err: any) {
      if (err?.message?.includes("Not authenticated")) {
        setError("You must be logged in to create an assignee.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation resources for unauthenticated users
  const resources = [
    { name: "/assignees", path: "/assignees" },
    { name: "/assignments", path: "/assignments" },
    { name: "/week", path: "/week" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <ThemeSwitcherHome />
            <Link
              to={
                isAuthenticated
                  ? DashboardRoute.fullPath
                  : AuthLoginRoute.fullPath
              }
              className={buttonVariants({ size: "sm" })}
            >
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container flex-1 py-8">
        <div className="mx-auto max-w-2xl">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : !isAuthenticated ? (
            <>
              <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
                Resource Navigation
              </h1>
              <div className="grid gap-4">
                {resources.map((resource) => (
                  <Link
                    key={resource.path}
                    to={resource.path}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "w-full justify-start text-left font-normal",
                    )}
                  >
                    <span className="text-lg">{resource.name}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-6 text-center text-4xl font-bold tracking-tight">
                Task Assignees
              </h1>

              <div className="mb-6 text-center">
                <button
                  onClick={() => setOpen(true)}
                  className="inline-block text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  Add New Assignee
                </button>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Assignee</DialogTitle>
                    <DialogDescription>
                      Add a new person to assign tasks to.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Assignee Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Enter assignee name"
                        required
                      />
                    </div>
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setName("");
                          setError(null);
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? "Creating..." : "Create Assignee"}
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {assignees?.map((assignee) => (
                  <div
                    key={assignee._id}
                    className="p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <Link
                        to="/week/assignee/$assignee_id"
                        params={{ assignee_id: assignee._id }}
                        className="text-lg text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {assignee.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Created:{" "}
                        {new Date(assignee._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {assignees?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No assignees available yet.
                    </p>
                    <button
                      onClick={() => setOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Create Your First Assignee
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
