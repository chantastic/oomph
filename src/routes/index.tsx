import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "../ui/logo";
import { cn } from "@/utils/misc";
import { buttonVariants } from "@/ui/button-util";
import { ThemeSwitcherHome } from "@/ui/theme-switcher";
import { useConvexAuth } from "@convex-dev/react-query";
import { Route as AuthLoginRoute } from "@/routes/_app/login/_layout.index";
import { Route as DashboardRoute } from "@/routes/_app/_auth/dashboard/_layout.index";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  const resources = [
    { name: "/tasks", path: "/tasks" },
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
        </div>
      </div>
    </div>
  );
}
