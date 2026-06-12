'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { NotificationBell } from '@/components/shared/notification-bell'
import { cn } from '@/lib/utils'
import {
  Zap, LayoutDashboard, Users, CheckSquare, BookOpen,
  MessageCircle, CreditCard, LogOut, ChevronLeft, ChevronRight,
  Map, FileText, Megaphone, Menu, X
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const mentorNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/mentor', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Students', href: '/dashboard/mentor/students', icon: <Users className="w-4 h-4" /> },
  { label: 'Tasks', href: '/dashboard/mentor/tasks', icon: <CheckSquare className="w-4 h-4" /> },
  { label: 'Resources', href: '/dashboard/mentor/resources', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Doubts', href: '/dashboard/mentor/doubts', icon: <MessageCircle className="w-4 h-4" /> },
  { label: 'Announcements', href: '/dashboard/mentor/announcements', icon: <Megaphone className="w-4 h-4" /> },
  { label: 'Payments', href: '/dashboard/mentor/payments', icon: <CreditCard className="w-4 h-4" /> },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/student', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Roadmap', href: '/dashboard/student/roadmap', icon: <Map className="w-4 h-4" /> },
  { label: 'Tasks', href: '/dashboard/student/tasks', icon: <CheckSquare className="w-4 h-4" /> },
  { label: 'Resources', href: '/dashboard/student/resources', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Notes', href: '/dashboard/student/notes', icon: <FileText className="w-4 h-4" /> },
  { label: 'Doubts', href: '/dashboard/student/doubts', icon: <MessageCircle className="w-4 h-4" /> },
  { label: 'Payments', href: '/dashboard/student/payments', icon: <CreditCard className="w-4 h-4" /> },
]

interface SidebarProps {
  role: 'mentor' | 'student'
  userName: string
  profileId: string
}

export function Sidebar({ role, userName, profileId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = role === 'mentor' ? mentorNav : studentNav

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({ title: 'Signed out', description: 'See you next time!' })
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === `/dashboard/${role}`) return pathname === href
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-border", collapsed && "justify-center px-0")}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-base tracking-tight">Pathforge</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="section-label px-3 py-2 mt-1">
            {role === 'mentor' ? 'Mentor' : 'Student'} Portal
          </p>
        )}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'nav-item',
              collapsed ? 'justify-center px-0 py-3' : '',
              isActive(item.href) ? 'active' : ''
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className={cn("p-3 border-t border-border space-y-1", collapsed && "px-1")}>
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn("nav-item w-full text-left hover:text-red-400", collapsed && "justify-center px-0 py-3")}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-200 flex-shrink-0",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-card border-r border-border transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'mentor' | 'student'
  userName: string
  profileId: string
}

export function DashboardLayout({ children, role, userName, profileId }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} userName={userName} profileId={profileId} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-sm border-b border-border lg:pl-6 pl-14">
          <div />
          <NotificationBell profileId={profileId} />
        </header>
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
