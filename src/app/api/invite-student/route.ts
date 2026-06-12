import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, track } = await req.json()

    // Verify requester is mentor
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: mentor } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    if (mentor?.role !== 'mentor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Use service role to invite user
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: { name, role: 'student', track },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    })

    if (error) {
      // If user already exists, just update their profile track
      if (error.message.includes('already been registered')) {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create profile immediately
    await adminSupabase.from('profiles').upsert({
      user_id: data.user.id,
      name,
      email,
      role: 'student',
      track,
      current_phase: 1,
    }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
