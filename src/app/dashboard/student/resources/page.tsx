import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcProgress, getResourceTypeColor } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { ResourceCard } from '@/components/student/resource-card'
import { BookOpen } from 'lucide-react'

export default async function StudentResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: resources } = await supabase
    .from('resources')
    .select('*, resource_progress!left(completed, student_id)')
    .or(`assigned_to.eq.${profile.id},assigned_to.is.null`)
    .order('created_at', { ascending: false })

  const filtered = resources?.map(r => ({
    ...r,
    completed: (r.resource_progress as any[])
      ?.find((rp: any) => rp.student_id === profile.id)?.completed ?? false,
  })) ?? []

  const completedCount = filtered.filter(r => r.completed).length
  const total = filtered.length

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="text-muted-foreground mt-1">{completedCount} of {total} completed</p>
        </div>
      </div>

      {total > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Overall Progress</p>
            <p className="text-sm font-bold text-primary">{calcProgress(completedCount, total)}%</p>
          </div>
          <Progress value={calcProgress(completedCount, total)} className="h-2" />
        </div>
      )}

      {total === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No resources yet</h3>
          <p className="text-sm text-muted-foreground">
            Your mentor will add learning materials here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <ResourceCard
              key={r.id}
              resource={r}
              studentId={profile.id}
              initialCompleted={r.completed}
            />
          ))}
        </div>
      )}
    </div>
  )
}
