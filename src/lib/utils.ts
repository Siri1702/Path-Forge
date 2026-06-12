import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateIST(dateStr: string, fmt = 'dd MMM yyyy') {
  try {
    // Parse the date and format it (IST offset handled by Supabase storing UTC)
    const date = parseISO(dateStr)
    return format(date, fmt)
  } catch {
    return dateStr
  }
}

export function formatRelativeIST(dateStr: string) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function isOverdue(dueDateStr: string): boolean {
  try {
    const due = parseISO(dueDateStr)
    return due < new Date()
  } catch {
    return false
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20'
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20'
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'paid': return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'overdue': return 'text-red-400 bg-red-400/10 border-red-400/20'
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export function getResourceTypeColor(type: string) {
  switch (type) {
    case 'Video': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    case 'Article': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'Project': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case 'Practice': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export function calcProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}
