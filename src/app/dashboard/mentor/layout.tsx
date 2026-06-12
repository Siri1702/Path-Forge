import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/shared/dashboard-layout'

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'mentor') redirect('/dashboard/student')

  return (
    <DashboardLayout role="mentor" userName={profile.name} profileId={profile.id}>
      {children}
    </DashboardLayout>
  )
}
