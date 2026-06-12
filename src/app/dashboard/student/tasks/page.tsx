import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/student/kanban-board'

export default async function StudentTasksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: taskProgress } = await supabase
    .from('task_progress')
    .select('*, tasks(*)')
    .eq('student_id', profile.id)
    .order('updated_at', { ascending: false })

  const columns = {
    todo: (taskProgress ?? [])
      .filter(tp => tp.status === 'todo')
      .map(tp => ({ ...tp, task: tp.tasks as any })),
    inprogress: (taskProgress ?? [])
      .filter(tp => tp.status === 'inprogress')
      .map(tp => ({ ...tp, task: tp.tasks as any })),
    done: (taskProgress ?? [])
      .filter(tp => tp.status === 'done')
      .map(tp => ({ ...tp, task: tp.tasks as any })),
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {taskProgress?.length ?? 0} total · {columns.done.length} done
          </p>
        </div>
      </div>
      <KanbanBoard initialColumns={columns} studentId={profile.id} />
    </div>
  )
}
