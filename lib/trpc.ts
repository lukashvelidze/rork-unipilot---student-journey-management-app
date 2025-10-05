import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL as string;
  }

  if (typeof window !== "undefined" && (window as any).location?.origin) {
    return ((window as any).location.origin as string) ?? "";
  }

  if (__DEV__) {
    return "http://localhost:3000";
  }

  return ""; // Avoid throwing to prevent crashes on devices without env configured
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            "Content-Type": "application/json",
          },
        }).catch((error) => {
          console.error("TRPC fetch error:", error);
          throw new Error("Network error: Unable to connect to server");
        });
      },
    }),
  ],
});
