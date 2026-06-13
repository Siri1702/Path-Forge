import { NextResponse } from 'next/server'

// TEMPORARY diagnostic endpoint — delete after confirming env vars work
export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `SET ✓ (starts with: ${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...)`
      : 'MISSING ✗',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `SET ✓ (starts with: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20)}...)`
      : 'MISSING ✗',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'SET ✓'
      : 'MISSING ✗',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING ✗',
    NODE_ENV: process.env.NODE_ENV,
  })
}
