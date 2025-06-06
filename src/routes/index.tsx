import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "../ui/logo";
import { buttonVariants } from "@/ui/button-util";
import { ThemeSwitcherHome } from "@/ui/theme-switcher";
import { useConvexAuth } from "@convex-dev/react-query";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
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

  // Modal state and form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createAssignee = useMutation(api.assignees.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser) return;

    if (name.trim()) {
      try {
        await createAssignee({ name: name.trim(), userId: currentUser._id });
        setName("");
        setError(null);
        setIsModalOpen(false);
      } catch (err: any) {
        if (err?.message?.includes("Not authenticated")) {
          setError("You must be logged in to create an assignee.");
        } else {
          setError("An unexpected error occurred.");
        }
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setError(null);
  };

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
                Please Log In
              </h1>
              <p className="text-center text-gray-600 mb-8">
                You need to be logged in to view and manage assignees.
              </p>
              <div className="text-center">
                <Link
                  to={AuthLoginRoute.fullPath}
                  className={buttonVariants({ size: "lg" })}
                >
                  Log In
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-6">Available Assignees</h1>

              <button
                onClick={() => setIsModalOpen(true)}
                className="mb-4 inline-block text-blue-600 hover:underline"
              >
                Add New Assignee
              </button>

              {/* Modal */}
              {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Create New Assignee</h2>
                      <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Assignee Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          autoFocus
                        />
                      </div>
                      {error && (
                        <div className="text-red-600 mb-2">{error}</div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Create Assignee
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {assignees?.map((assignee) => (
                  <div
                    key={assignee._id}
                    className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
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
                      onClick={() => setIsModalOpen(true)}
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
