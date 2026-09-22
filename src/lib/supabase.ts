import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { APIContext, AstroCookies } from "astro"

export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: { flowType: "pkce", persistSession: false },
  }
)

const cookieNames = new WeakMap<AstroCookies, Set<string>>()

export function createSupabaseServerClient(context: { request: Request; cookies: AstroCookies }) {
  let names = cookieNames.get(context.cookies)
  if (!names) {
    names = new Set(
      (context.request.headers.get("cookie") ?? "")
        .split(";")
        .map(cookie => cookie.trim().split("=")[0])
        .filter(Boolean)
    )
    cookieNames.set(context.cookies, names)
  }
  const sessionCookie = `sb-${new URL(import.meta.env.SUPABASE_URL).hostname.split(".")[0]}-auth-token`
  const hasSsrSession = [...names].some(
    name =>
      (name === sessionCookie ||
        (/^\d+$/.test(name.slice(sessionCookie.length + 1)) &&
          name.startsWith(`${sessionCookie}.`))) &&
      !!context.cookies.get(name)?.value
  )
  // Support sessions created before the migration to Supabase SSR cookies.
  const accessToken = !hasSsrSession ? context.cookies.get("sb-access-token")?.value : undefined
  return createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    cookies: {
      getAll() {
        return [...names].flatMap(name => {
          const cookie = context.cookies.get(name)
          return cookie?.value ? [{ name, value: cookie.value }] : []
        })
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          names.add(name)
          context.cookies.set(name, value, {
            ...options,
            path: options?.path ?? "/",
          })
        }
      },
    },
  })
}

export const createUserClient = async (cookies: APIContext["cookies"]): Promise<SupabaseClient> => {
  const accessToken = cookies.get("sb-access-token")?.value

  const client = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: { persistSession: false },
  })

  return client
}
