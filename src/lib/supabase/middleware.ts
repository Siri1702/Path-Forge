import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Guard: if env vars are missing, redirect to a helpful error page
  // instead of crashing with "invalid URL"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Let the request through — the page will show a config error
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser()
  // It will cause session bugs. Always call getUser() first.
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Public routes ──────────────────────────────────────────────
  if (pathname === '/' || pathname === '/login') {
    if (user) {
      // Fetch role from user metadata first (fastest), fall back to DB
      const role = user.user_metadata?.role as string | undefined

      if (role === 'mentor') {
        return NextResponse.redirect(new URL('/dashboard/mentor', request.url))
      } else if (role === 'student') {
        return NextResponse.redirect(new URL('/dashboard/student', request.url))
      }

      // Metadata missing (manually-created mentor) — check DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile?.role === 'mentor') {
        return NextResponse.redirect(new URL('/dashboard/mentor', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard/student', request.url))
    }
    return supabaseResponse
  }

  // ── Protected routes ───────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Role guard: use metadata when available to avoid extra DB call
    const metaRole = user.user_metadata?.role as string | undefined

    if (metaRole) {
      if (pathname.startsWith('/dashboard/mentor') && metaRole !== 'mentor') {
        return NextResponse.redirect(new URL('/dashboard/student', request.url))
      }
      if (pathname.startsWith('/dashboard/student') && metaRole !== 'student') {
        return NextResponse.redirect(new URL('/dashboard/mentor', request.url))
      }
      return supabaseResponse
    }

    // No metadata — check DB (manually-created accounts like the first mentor)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      // Profile not yet created — let them through, page layout will handle it
      return supabaseResponse
    }

    if (pathname.startsWith('/dashboard/mentor') && profile.role !== 'mentor') {
      return NextResponse.redirect(new URL('/dashboard/student', request.url))
    }
    if (pathname.startsWith('/dashboard/student') && profile.role !== 'student') {
      return NextResponse.redirect(new URL('/dashboard/mentor', request.url))
    }
  }

  return supabaseResponse
}
