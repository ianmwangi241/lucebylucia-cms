import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequest, setCookie } from "@tanstack/react-start/server";
import type { Database } from "./types";

export function createClient() {
  const request = getRequest();

  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request?.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options);
          });
        },
      },
    }
  );
}