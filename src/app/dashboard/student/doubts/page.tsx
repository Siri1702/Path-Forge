import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelativeIST } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AskDoubtForm } from '@/components/student/ask-doubt-form'
import { MessageCircle, CheckCircle } from 'lucide-react'

export default async function StudentDoubtsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: doubts } = await supabase
    .from('doubts')
    .select('*')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doubts</h1>
          <p className="text-muted-foreground mt-1">
            {doubts?.filter(d => d.status === 'open').length ?? 0} open
          </p>
        </div>
      </div>

      <AskDoubtForm studentId={profile.id} />

      <div className="space-y-3">
        <p className="section-label">Your Questions</p>
        {!doubts?.length ? (
          <div className="glass-card p-12 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No doubts submitted yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Ask your mentor anything — they'll reply here.
            </p>
          </div>
        ) : (
          doubts.map(doubt => (
            <div
              key={doubt.id}
              className={`glass-card p-5 ${doubt.status === 'answered' && !doubt.mentor_reply ? '' :
                doubt.status === 'answered' ? 'border-green-500/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{doubt.question}</p>
                  {doubt.topic_tag && (
                    <span className="badge-pill text-xs text-slate-400 bg-slate-400/10 border-slate-400/20 mt-1 inline-block">
                      {doubt.topic_tag}
                    </span>
                  )}
                </div>
                <Badge variant={doubt.status === 'answered' ? 'success' : 'warning'}>
                  {doubt.status === 'answered' ? '✓ Answered' : 'Open'}
                </Badge>
              </div>

              {doubt.mentor_reply && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-semibold text-primary">Mentor's Reply</p>
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{doubt.mentor_reply}</p>
                    {doubt.replied_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Replied {formatRelativeIST(doubt.replied_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Asked {formatRelativeIST(doubt.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
