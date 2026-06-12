import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRelativeIST } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Users, CheckSquare, CreditCard, MessageCircle, ArrowRight, UserPlus, Megaphone } from 'lucide-react'
import { AddStudentDialog } from '@/components/mentor/add-student-dialog'

export default async function MentorHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mentor } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  // Parallel data fetching
  const [
    { data: students },
    { data: pendingTasks },
    { data: overduePayments },
    { data: openDoubts },
    { data: recentDoubts },
    { data: recentTaskUpdates },
  ] = await Promise.all([
    supabase.from('profiles').select('id').eq('role', 'student'),
    supabase.from('task_progress').select('id').eq('status', 'todo'),
    supabase.from('payments').select('id').eq('status', 'overdue'),
    supabase.from('doubts').select('id').eq('status', 'open'),
    supabase.from('doubts').select('*, profiles(name)').order('created_at', { ascending: false }).limit(3),
    supabase.from('task_progress').select('*, tasks(title), profiles(name)').eq('status', 'done').order('updated_at', { ascending: false }).limit(3),
  ])

  const stats = [
    {
      label: 'Total Students',
      value: students?.length ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      href: '/dashboard/mentor/students',
    },
    {
      label: 'Tasks Pending Review',
      value: pendingTasks?.length ?? 0,
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      href: '/dashboard/mentor/tasks',
    },
    {
      label: 'Open Doubts',
      value: openDoubts?.length ?? 0,
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      href: '/dashboard/mentor/doubts',
    },
    {
      label: 'Payments Overdue',
      value: overduePayments?.length ?? 0,
      icon: <CreditCard className="w-5 h-5" />,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      href: '/dashboard/mentor/payments',
    },
  ]

  const activityFeed = [
    ...(recentDoubts ?? []).map((d: any) => ({
      type: 'doubt',
      label: `${d.profiles?.name} asked a doubt`,
      sub: d.question?.slice(0, 60) + (d.question?.length > 60 ? '…' : ''),
      time: d.created_at,
      href: '/dashboard/mentor/doubts',
    })),
    ...(recentTaskUpdates ?? []).map((t: any) => ({
      type: 'task',
      label: `${t.profiles?.name} completed a task`,
      sub: t.tasks?.title,
      time: t.updated_at,
      href: '/dashboard/mentor/tasks',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good day, {mentor?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your cohort.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddStudentDialog />
          <Link href="/dashboard/mentor/announcements" className="btn-secondary">
            <Megaphone className="w-4 h-4" />
            Announce
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="stat-card hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity feed */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Recent Activity</h2>
          <p className="text-xs text-muted-foreground section-label">Last 5 events</p>
        </div>

        {activityFeed.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity from students yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Activity will appear here when students interact with the platform.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activityFeed.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.type === 'doubt' ? 'bg-purple-400/10' : 'bg-green-400/10'
                }`}>
                  {item.type === 'doubt'
                    ? <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                    : <CheckSquare className="w-3.5 h-3.5 text-green-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.label}</p>
                  {item.sub && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.sub}</p>}
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeIST(item.time)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Manage Students', desc: 'View all students and their progress', href: '/dashboard/mentor/students', icon: <Users className="w-5 h-5" /> },
          { label: 'Assign Tasks', desc: 'Create tasks for individuals or cohorts', href: '/dashboard/mentor/tasks', icon: <CheckSquare className="w-5 h-5" /> },
          { label: 'Answer Doubts', desc: `${openDoubts?.length ?? 0} questions waiting`, href: '/dashboard/mentor/doubts', icon: <MessageCircle className="w-5 h-5" /> },
        ].map(q => (
          <Link key={q.label} href={q.href} className="glass-card p-5 hover:border-primary/30 transition-all group">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
              {q.icon}
            </div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{q.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{q.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
