import { createClient } from '@/lib/supabase/server'
import { getResourceTypeColor } from '@/lib/utils'
import { BookOpen, ExternalLink } from 'lucide-react'

interface Props { studentId: string }

export async function StudentResourcesTab({ studentId }: Props) {
  const supabase = createClient()
  const { data: resources } = await supabase
    .from('resources')
    .select('*, resource_progress(completed)')
    .or(`assigned_to.eq.${studentId},assigned_to.is.null`)
    .order('created_at', { ascending: false })

  if (!resources?.length) {
    return (
      <div className="glass-card p-12 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No resources assigned yet.</p>
      </div>
    )
  }

  const completed = resources.filter(r => (r.resource_progress as any[])?.[0]?.completed).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{completed} of {resources.length} completed</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((r) => (
          <div key={r.id} className="glass-card p-4 flex items-start justify-between gap-3">
            <div>
              <span className={`badge-pill ${getResourceTypeColor(r.type)} mb-2 inline-block`}>{r.type}</span>
              <p className="text-sm font-medium">{r.title}</p>
              {r.phase_tag && <p className="text-xs text-muted-foreground mt-1">Phase {r.phase_tag}</p>}
            </div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-ghost shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
