'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getResourceTypeColor } from '@/lib/utils'
import { ExternalLink, CheckCircle, Circle } from 'lucide-react'

interface Resource {
  id: string
  title: string
  url: string
  type: string
  phase_tag?: number
}

interface Props {
  resource: Resource
  studentId: string
  initialCompleted: boolean
}

export function ResourceCard({ resource, studentId, initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const toggle = async () => {
    setLoading(true)
    const newVal = !completed
    setCompleted(newVal)

    const { error } = await supabase
      .from('resource_progress')
      .upsert({
        resource_id: resource.id,
        student_id: studentId,
        completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      }, { onConflict: 'resource_id,student_id' })

    setLoading(false)
    if (error) {
      setCompleted(!newVal)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else if (newVal) {
      toast({ title: '✅ Marked as done!', description: resource.title })
    }
  }

  return (
    <div className={`glass-card p-5 flex flex-col gap-3 transition-all ${completed ? 'opacity-60' : 'hover:border-primary/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`badge-pill ${getResourceTypeColor(resource.type)}`}>{resource.type}</span>
        {resource.phase_tag && (
          <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20 text-xs">
            Phase {resource.phase_tag}
          </span>
        )}
      </div>

      <p className={`text-sm font-medium leading-snug flex-1 ${completed ? 'line-through text-muted-foreground' : ''}`}>
        {resource.title}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={toggle}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {completed
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <Circle className="w-4 h-4" />
          }
          {completed ? 'Completed' : 'Mark done'}
        </button>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs py-1 px-2"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
