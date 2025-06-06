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

// Environment-only approach like your authkit pattern
function getConvexUrl() {
  if (!import.meta.env.VITE_CONVEX_URL) {
    throw new Error("VITE_CONVEX_URL not set");
  }
  return import.meta.env.VITE_CONVEX_URL;
}

const convexUrl = getConvexUrl();
console.log("📡 Using Convex URL:", convexUrl);

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
