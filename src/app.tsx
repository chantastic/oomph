import { ConvexReactClient } from "convex/react";
import { RouterProvider } from "@tanstack/react-router";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { router } from "@/router";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "@/i18n";

// Debug logging for production environment variable checking
console.log("🔍 Environment Variable Debug:");
console.log("VITE_CONVEX_URL:", import.meta.env.VITE_CONVEX_URL);
console.log("All env vars:", import.meta.env);
console.log("NODE_ENV:", import.meta.env.NODE_ENV);
console.log("MODE:", import.meta.env.MODE);

// For now, let's see what we get from build-time injection
const convexUrl =
  import.meta.env.VITE_CONVEX_URL || "https://brazen-snake-307.convex.cloud";
console.log("📡 Using Convex URL:", convexUrl);

if (!import.meta.env.VITE_CONVEX_URL) {
  console.error("❌ VITE_CONVEX_URL is not set! Using dev URL as fallback.");
}

const convex = new ConvexReactClient(convexUrl);

const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});

convexQueryClient.connect(queryClient);

function InnerApp() {
  return <RouterProvider router={router} context={{ queryClient }} />;
}

const helmetContext = {};

export default function App() {
  return (
    <HelmetProvider context={helmetContext}>
      <ConvexAuthProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          <InnerApp />
        </QueryClientProvider>
      </ConvexAuthProvider>
    </HelmetProvider>
  );
}
