import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}\n` +
      `Add it in Vercel → Project → Settings → Environment Variables.`
    )
  }
  return value
}

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}
