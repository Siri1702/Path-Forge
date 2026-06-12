import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateIST } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AddStudentDialog } from '@/components/mentor/add-student-dialog'
import { Users, ArrowRight } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  // Fetch task completion stats for each student
  const studentIds = students?.map(s => s.id) ?? []
  const { data: taskProgress } = await supabase
    .from('task_progress')
    .select('student_id, status')
    .in('student_id', studentIds)

  const { data: payments } = await supabase
    .from('payments')
    .select('student_id, status')
    .in('student_id', studentIds)

  const getProgress = (studentId: string) => {
    const tasks = taskProgress?.filter(t => t.student_id === studentId) ?? []
    if (!tasks.length) return 0
    const done = tasks.filter(t => t.status === 'done').length
    return Math.round((done / tasks.length) * 100)
  }

  const getPaymentStatus = (studentId: string) => {
    const p = payments?.find(p => p.student_id === studentId)
    return p?.status ?? 'none'
  }

  const paymentBadge = (status: string) => {
    if (status === 'paid') return <Badge variant="success">Paid</Badge>
    if (status === 'overdue') return <Badge variant="destructive">Overdue</Badge>
    if (status === 'pending') return <Badge variant="warning">Pending</Badge>
    return <Badge variant="secondary">—</Badge>
  }

  const trackColor = (track: string) => {
    if (track === 'ML Engineer') return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    if (track === 'Data Scientist') return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-muted-foreground mt-1">{students?.length ?? 0} enrolled students</p>
        </div>
        <AddStudentDialog />
      </div>

      {!students?.length ? (
        <div className="glass-card p-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No students yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Invite your first student to get started.</p>
          <AddStudentDialog />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Track</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phase</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => {
                  const prog = getProgress(student.id)
                  return (
                    <tr key={student.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                            {student.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge-pill ${trackColor(student.track ?? '')}`}>
                          {student.track ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20">
                          Phase {student.current_phase ?? 1}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 w-32">
                          <Progress value={prog} className="flex-1 h-1.5" />
                          <span className="text-xs text-muted-foreground w-8 text-right">{prog}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{paymentBadge(getPaymentStatus(student.id))}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {formatDateIST(student.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/mentor/students/${student.id}`}
                          className="btn-ghost text-xs"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
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
