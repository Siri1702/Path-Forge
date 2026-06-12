import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelativeIST } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DoubtsReplyClient } from '@/components/mentor/doubts-reply-client'
import { MessageCircle } from 'lucide-react'

export default async function MentorDoubtsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: doubts } = await supabase
    .from('doubts')
    .select('*, profiles!doubts_student_id_fkey(id, name, email)')
    .order('created_at', { ascending: false })

  const openDoubts = doubts?.filter(d => d.status === 'open') ?? []
  const answeredDoubts = doubts?.filter(d => d.status === 'answered') ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doubts Inbox</h1>
          <p className="text-muted-foreground mt-1">
            {openDoubts.length} open · {answeredDoubts.length} answered
          </p>
        </div>
      </div>

      {!doubts?.length ? (
        <div className="glass-card p-16 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No doubts yet</h3>
          <p className="text-sm text-muted-foreground">
            Student questions will appear here once they start submitting.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {openDoubts.length > 0 && (
            <div>
              <p className="section-label mb-4">Open ({openDoubts.length})</p>
              <div className="space-y-3">
                {openDoubts.map(doubt => (
                  <DoubtsReplyClient key={doubt.id} doubt={doubt} />
                ))}
              </div>
            </div>
          )}

          {answeredDoubts.length > 0 && (
            <div>
              <p className="section-label mb-4">Answered ({answeredDoubts.length})</p>
              <div className="space-y-3">
                {answeredDoubts.map(doubt => (
                  <div key={doubt.id} className="glass-card p-5 opacity-70">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                          {(doubt.profiles as any)?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{(doubt.profiles as any)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doubt.topic_tag && (
                          <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20 text-xs">
                            {doubt.topic_tag}
                          </span>
                        )}
                        <Badge variant="success">Answered</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 mb-3">{doubt.question}</p>
                    {doubt.mentor_reply && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <p className="text-xs text-primary font-medium mb-1">Your reply</p>
                        <p className="text-sm text-foreground/80">{doubt.mentor_reply}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeIST(doubt.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
