import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/shared/dashboard-layout'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/dashboard/mentor')

  return (
    <DashboardLayout role="student" userName={profile.name} profileId={profile.id}>
      {children}
    </DashboardLayout>
  )
}
