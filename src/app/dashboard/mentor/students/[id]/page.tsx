import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatDateIST } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProgressRing } from '@/components/shared/progress-ring'
import { StudentTasksTab } from '@/components/mentor/student-tasks-tab'
import { StudentDoubtsTab } from '@/components/mentor/student-doubts-tab'
import { StudentPaymentsTab } from '@/components/mentor/student-payments-tab'
import { StudentResourcesTab } from '@/components/mentor/student-resources-tab'
import { EditStudentDialog } from '@/components/mentor/edit-student-dialog'
import { RoadmapManager } from '@/components/mentor/roadmap-manager'
import { ArrowLeft, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function StudentProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get mentor profile ID (needed for roadmap created_by)
  const { data: mentor } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!mentor || mentor.role !== 'mentor') redirect('/dashboard/student')

  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'student')
    .single()

  if (!student) notFound()

  const [
    { data: taskProgress },
    { data: payments },
    { data: roadmapPhases },
  ] = await Promise.all([
    supabase.from('task_progress').select('status').eq('student_id', student.id),
    supabase
      .from('payments')
      .select('*')
      .eq('student_id', student.id)
      .order('due_date', { ascending: false })
      .limit(1),
    supabase
      .from('roadmap_phases')
      .select('*')
      .eq('student_id', student.id)
      .order('phase_number'),
  ])

  const totalTasks = taskProgress?.length ?? 0
  const doneTasks = taskProgress?.filter(t => t.status === 'done').length ?? 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const latestPayment = payments?.[0]

  const trackColor = (track: string) => {
    if (track === 'ML Engineer') return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    if (track === 'Data Scientist') return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/dashboard/mentor/students" className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Profile header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
            {student.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <span className={`badge-pill ${trackColor(student.track ?? '')}`}>
                {student.track ?? 'No track'}
              </span>
              <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20">
                Phase {student.current_phase ?? 1}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {student.email}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Joined {formatDateIST(student.created_at)}
              </span>
            </div>
            {student.bio && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{student.bio}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <ProgressRing value={progress} size={80} label="done" />
            {/* ← Edit button lives here, always visible */}
            <EditStudentDialog student={student} />
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{totalTasks}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{doneTasks}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {latestPayment ? (
                <span className={
                  latestPayment.status === 'paid' ? 'text-green-400' :
                  latestPayment.status === 'overdue' ? 'text-red-400' : 'text-yellow-400'
                }>
                  {latestPayment.status.charAt(0).toUpperCase() + latestPayment.status.slice(1)}
                </span>
              ) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Payment</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roadmap">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="doubts">Doubts</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap">
          <RoadmapManager
            studentId={student.id}
            mentorId={mentor.id}
            initialPhases={(roadmapPhases ?? []).map(p => ({
              ...p,
              topics: Array.isArray(p.topics) ? p.topics : [],
            }))}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <StudentTasksTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="resources">
          <StudentResourcesTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="doubts">
          <StudentDoubtsTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="payments">
          <StudentPaymentsTab studentId={student.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
