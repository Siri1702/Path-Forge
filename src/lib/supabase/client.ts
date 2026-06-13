import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Read at call-time, not module load time, so build phase never throws
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a dummy client during static generation / misconfigured builds
    // The login page will catch this and show a helpful error instead of crashing
    throw new Error(
      `Missing environment variable: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'}\n` +
      `Make sure it is set in Vercel → Project → Settings → Environment Variables.\n` +
      `See .env.local.example for the full list.`
    )
  }

  return createBrowserClient(url, key)
}
