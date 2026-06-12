import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateIST, getPriorityColor, isOverdue } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CreateTaskDialog } from '@/components/mentor/create-task-dialog'
import { CheckSquare } from 'lucide-react'

export default async function MentorTasksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tasks }, { data: students }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, profiles!tasks_assigned_to_fkey(name), task_progress(student_id, status)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name').eq('role', 'student'),
  ])

  const statusSummary = (taskId: string, progresses: any[]) => {
    const tp = progresses ?? []
    const done = tp.filter((p: any) => p.status === 'done').length
    const total = tp.length
    return total > 0 ? `${done}/${total} done` : 'No progress'
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {tasks?.length ?? 0} tasks across all students
          </p>
        </div>
        <CreateTaskDialog students={students ?? []} />
      </div>

      {!tasks?.length ? (
        <div className="glass-card p-16 text-center">
          <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first task to assign to students.
          </p>
          <CreateTaskDialog students={students ?? []} />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned To</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phase</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => {
                  const overdue = task.due_date ? isOverdue(task.due_date) : false
                  return (
                    <tr key={task.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {(task.profiles as any)?.name ?? (
                          <span className="text-primary">All Students</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge-pill ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {task.phase_tag ? `Phase ${task.phase_tag}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {task.due_date ? (
                          <span className={overdue ? 'text-red-400' : 'text-muted-foreground'}>
                            {formatDateIST(task.due_date)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {statusSummary(task.id, task.task_progress as any[])}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
