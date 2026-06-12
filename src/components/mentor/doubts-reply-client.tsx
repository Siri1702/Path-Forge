'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeIST } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send } from 'lucide-react'

interface DoubtWithProfile {
  id: string
  student_id: string
  question: string
  topic_tag?: string
  status: string
  mentor_reply?: string
  created_at: string
  profiles?: { id: string; name: string; email: string }
}

export function DoubtsReplyClient({ doubt }: { doubt: DoubtWithProfile }) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleReply = async () => {
    if (!reply.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('doubts')
        .update({
          mentor_reply: reply,
          status: 'answered',
          replied_at: new Date().toISOString(),
        })
        .eq('id', doubt.id)

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }

      // Notify student
      await supabase.from('notifications').insert({
        user_id: doubt.student_id,
        type: 'doubt_answered',
        message: `Your doubt has been answered by your mentor`,
        link: '/dashboard/student/doubts',
      })

      toast({ title: 'Reply sent!', description: 'Student will be notified.' })
      setReply('')
      setExpanded(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 border-l-2 border-l-primary/50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
            {doubt.profiles?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-medium">{doubt.profiles?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {doubt.topic_tag && (
            <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20 text-xs">
              {doubt.topic_tag}
            </span>
          )}
          <Badge variant="warning">Open</Badge>
        </div>
      </div>

      <p className="text-sm text-foreground/90 mb-3 leading-relaxed">{doubt.question}</p>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{formatRelativeIST(doubt.created_at)}</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-ghost text-xs text-primary"
        >
          {expanded ? 'Cancel' : 'Reply →'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            className="input-field h-24 resize-none"
            placeholder="Type your reply here..."
            autoFocus
          />
          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={!reply.trim() || loading}
              className="btn-primary text-sm"
            >
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending</>
                : <><Send className="w-3.5 h-3.5" /> Send Reply</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
