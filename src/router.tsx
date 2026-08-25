import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { setupOfflinePersistence } from "./lib/offline";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Offline-first: serve the persisted copy immediately, refresh when back online.
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 60 * 24 * 60,
        staleTime: 1000 * 30,
        retry: 1,
      },
      mutations: { networkMode: "offlineFirst" },
    },
  });

  setupOfflinePersistence(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
