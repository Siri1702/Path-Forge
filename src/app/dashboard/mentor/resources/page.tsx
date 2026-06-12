import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateIST, getResourceTypeColor } from '@/lib/utils'
import { AddResourceDialog } from '@/components/mentor/add-resource-dialog'
import { BookOpen, ExternalLink } from 'lucide-react'

export default async function MentorResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: resources }, { data: students }] = await Promise.all([
    supabase
      .from('resources')
      .select('*, profiles!resources_assigned_to_fkey(name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name').eq('role', 'student'),
  ])

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="text-muted-foreground mt-1">{resources?.length ?? 0} resources in library</p>
        </div>
        <AddResourceDialog students={students ?? []} />
      </div>

      {!resources?.length ? (
        <div className="glass-card p-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No resources yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Add learning materials for your students.</p>
          <AddResourceDialog students={students ?? []} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div key={r.id} className="glass-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-2">
                <span className={`badge-pill ${getResourceTypeColor(r.type)}`}>{r.type}</span>
                {r.phase_tag && (
                  <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20">
                    Phase {r.phase_tag}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm leading-snug">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  For: {(r.profiles as any)?.name ?? <span className="text-primary">All Students</span>}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{formatDateIST(r.created_at)}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs py-1 px-2"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
