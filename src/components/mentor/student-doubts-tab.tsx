import { createClient } from '@/lib/supabase/server'
import { formatRelativeIST } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface Props { studentId: string }

export async function StudentDoubtsTab({ studentId }: Props) {
  const supabase = createClient()
  const { data: doubts } = await supabase
    .from('doubts')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (!doubts?.length) {
    return (
      <div className="glass-card p-12 text-center">
        <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No doubts submitted yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {doubts.map((d) => (
        <div key={d.id} className="glass-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{d.question}</p>
              {d.topic_tag && <p className="text-xs text-muted-foreground mt-1">Topic: {d.topic_tag}</p>}
            </div>
            <Badge variant={d.status === 'answered' ? 'success' : 'warning'}>
              {d.status}
            </Badge>
          </div>
          {d.mentor_reply && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Your reply:</p>
              <p className="text-sm text-foreground/80">{d.mentor_reply}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">{formatRelativeIST(d.created_at)}</p>
        </div>
      ))}
      <Link href="/dashboard/mentor/doubts" className="btn-ghost text-xs">
        Answer doubts in the Doubts Inbox →
      </Link>
    </div>
  )
}
