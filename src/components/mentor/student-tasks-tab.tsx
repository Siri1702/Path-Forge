import { createClient } from '@/lib/supabase/server'
import { formatDateIST, getPriorityColor, isOverdue } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckSquare } from 'lucide-react'

interface Props { studentId: string }

export async function StudentTasksTab({ studentId }: Props) {
  const supabase = createClient()
  const { data: taskProgresses } = await supabase
    .from('task_progress')
    .select('*, tasks(*)')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })

  if (!taskProgresses?.length) {
    return (
      <div className="glass-card p-12 text-center">
        <CheckSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
      </div>
    )
  }

  const statusBadge = (status: string) => {
    if (status === 'done') return <Badge variant="success">Done</Badge>
    if (status === 'inprogress') return <Badge variant="default">In Progress</Badge>
    return <Badge variant="secondary">To Do</Badge>
  }

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {taskProgresses.map((tp) => (
            <tr key={tp.id} className="hover:bg-secondary/30 transition-colors">
              <td className="px-5 py-3.5">
                <p className="text-sm font-medium">{(tp.tasks as any)?.title}</p>
                {(tp.tasks as any)?.phase_tag && (
                  <p className="text-xs text-muted-foreground">Phase {(tp.tasks as any).phase_tag}</p>
                )}
              </td>
              <td className="px-5 py-3.5">
                <span className={`badge-pill ${getPriorityColor((tp.tasks as any)?.priority)}`}>
                  {(tp.tasks as any)?.priority}
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm">
                {(tp.tasks as any)?.due_date ? (
                  <span className={isOverdue((tp.tasks as any).due_date) && tp.status !== 'done' ? 'text-red-400' : 'text-muted-foreground'}>
                    {formatDateIST((tp.tasks as any).due_date)}
                  </span>
                ) : '—'}
              </td>
              <td className="px-5 py-3.5">{statusBadge(tp.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
