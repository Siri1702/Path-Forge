import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelativeIST } from '@/lib/utils'
import { PostAnnouncementForm } from '@/components/mentor/post-announcement-form'
import { Megaphone } from 'lucide-react'

export default async function AnnouncementsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: announcements }, { data: students }] = await Promise.all([
    supabase
      .from('announcements')
      .select('*, profiles!announcements_target_fkey(name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name').eq('role', 'student'),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to your students</p>
        </div>
      </div>

      <PostAnnouncementForm students={students ?? []} />

      <div className="space-y-4">
        <p className="section-label">Past Announcements</p>
        {!announcements?.length ? (
          <div className="glass-card p-12 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-sm">{a.title}</h3>
                <span className="badge-pill text-xs text-slate-400 bg-slate-400/10 border-slate-400/20 flex-shrink-0">
                  {a.target ? `To: ${(a.profiles as any)?.name}` : 'All Students'}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{a.body}</p>
              <p className="text-xs text-muted-foreground mt-3">{formatRelativeIST(a.created_at)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
