import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateIST, formatRelativeIST, calcProgress } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ProgressRing } from '@/components/shared/progress-ring'
import { CheckSquare, BookOpen, MessageCircle, Map, Megaphone, Clock } from 'lucide-react'

export default async function StudentHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const [
    { data: taskProgress },
    { data: resources },
    { data: resourceProgress },
    { data: announcements },
    { data: openDoubts },
  ] = await Promise.all([
    supabase
      .from('task_progress')
      .select('*, tasks(*)')
      .eq('student_id', profile.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('resources')
      .select('id')
      .or(`assigned_to.eq.${profile.id},assigned_to.is.null`),
    supabase
      .from('resource_progress')
      .select('completed')
      .eq('student_id', profile.id)
      .eq('completed', true),
    supabase
      .from('announcements')
      .select('*')
      .or(`target.eq.${profile.id},target.is.null`)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('doubts')
      .select('id')
      .eq('student_id', profile.id)
      .eq('status', 'open'),
  ])

  const totalTasks = taskProgress?.length ?? 0
  const doneTasks = taskProgress?.filter(t => t.status === 'done').length ?? 0
  const overallProgress = calcProgress(doneTasks, totalTasks)

  const pendingTasks = taskProgress
    ?.filter(t => t.status !== 'done')
    .slice(0, 3) ?? []

  const totalResources = resources?.length ?? 0
  const completedResources = resourceProgress?.length ?? 0

  const latestAnnouncement = announcements?.[0]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="section-label mb-2">Welcome back</p>
          <h1 className="text-2xl font-bold">{profile.name} 👋</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="badge-pill text-primary bg-primary/10 border-primary/20">
              {profile.track ?? 'No Track Set'}
            </span>
            <span className="badge-pill text-slate-400 bg-slate-400/10 border-slate-400/20">
              Phase {profile.current_phase ?? 1}
            </span>
          </div>
        </div>
        <ProgressRing value={overallProgress} size={88} label="complete" />
      </div>

      {/* Announcement banner */}
      {latestAnnouncement && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <Megaphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">{latestAnnouncement.title}</p>
            <p className="text-sm text-foreground/80 mt-0.5">{latestAnnouncement.body}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatRelativeIST(latestAnnouncement.created_at)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus this week */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Your Focus This Week
            </h2>
            <Link href="/dashboard/student/tasks" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center">
              <CheckSquare className="w-8 h-8 text-green-400/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
              <p className="text-xs text-muted-foreground/60 mt-1">No pending tasks right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((tp) => {
                const task = tp.tasks as any
                return (
                  <div
                    key={tp.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task?.priority === 'high' ? 'bg-red-400' :
                      task?.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task?.title}</p>
                      {task?.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due {formatDateIST(task.due_date)}
                        </p>
                      )}
                    </div>
                    <Badge variant={tp.status === 'inprogress' ? 'default' : 'secondary'} className="text-xs">
                      {tp.status === 'inprogress' ? 'In Progress' : 'To Do'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-3">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Resources</p>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{completedResources}<span className="text-sm text-muted-foreground font-normal">/{totalResources}</span></p>
            <Progress value={calcProgress(completedResources, totalResources)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">completed</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Open Doubts</p>
              <MessageCircle className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold">{openDoubts?.length ?? 0}</p>
            <Link href="/dashboard/student/doubts" className="text-xs text-primary hover:underline mt-1 block">
              View doubts →
            </Link>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Tasks Done</p>
              <CheckSquare className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{doneTasks}<span className="text-sm text-muted-foreground font-normal text-foreground">/{totalTasks}</span></p>
            <p className="text-xs text-muted-foreground mt-1">tasks completed</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Roadmap', href: '/dashboard/student/roadmap', icon: <Map className="w-5 h-5" />, color: 'text-indigo-400' },
          { label: 'My Tasks', href: '/dashboard/student/tasks', icon: <CheckSquare className="w-5 h-5" />, color: 'text-blue-400' },
          { label: 'Resources', href: '/dashboard/student/resources', icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-400' },
          { label: 'Ask a Doubt', href: '/dashboard/student/doubts', icon: <MessageCircle className="w-5 h-5" />, color: 'text-cyan-400' },
        ].map(q => (
          <Link key={q.label} href={q.href}
            className="glass-card p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 transition-all group"
          >
            <div className={`${q.color} group-hover:scale-110 transition-transform`}>{q.icon}</div>
            <p className="text-xs font-medium">{q.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
