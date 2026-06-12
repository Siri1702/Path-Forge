'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'

interface Student { id: string; name: string }

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  phase_tag: z.string().optional(),
  assigned_to: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function CreateTaskDialog({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: mentor } = await supabase
        .from('profiles').select('id').eq('user_id', user!.id).single()

      const taskPayload = {
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        priority: data.priority,
        phase_tag: data.phase_tag ? parseInt(data.phase_tag) : null,
        assigned_to: data.assigned_to === 'all' || !data.assigned_to ? null : data.assigned_to,
        created_by: mentor!.id,
      }

      const { data: task, error: taskErr } = await supabase
        .from('tasks').insert(taskPayload).select().single()

      if (taskErr || !task) {
        toast({ title: 'Error', description: taskErr?.message, variant: 'destructive' })
        return
      }

      // Create task_progress rows
      let targetStudents: Student[] = []
      if (!data.assigned_to || data.assigned_to === 'all') {
        targetStudents = students
      } else {
        const s = students.find(s => s.id === data.assigned_to)
        if (s) targetStudents = [s]
      }

      if (targetStudents.length > 0) {
        await supabase.from('task_progress').insert(
          targetStudents.map(s => ({
            task_id: task.id,
            student_id: s.id,
            status: 'todo',
          }))
        )

        // Notify students
        await supabase.from('notifications').insert(
          targetStudents.map(s => ({
            user_id: s.id,
            type: 'task_assigned',
            message: `New task assigned: "${data.title}"`,
            link: '/dashboard/student/tasks',
          }))
        )
      }

      toast({ title: 'Task created!', description: `Assigned to ${targetStudents.length} student(s)` })
      reset()
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-primary">
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <input className="input-field" placeholder="e.g. Build a regression model" {...register('title')} />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="input-field h-20 resize-none"
              placeholder="What should the student do?"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select onValueChange={(v) => setValue('priority', v as any)} defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phase Tag</label>
              <Select onValueChange={(v) => setValue('phase_tag', v)}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Phase 1</SelectItem>
                  <SelectItem value="2">Phase 2</SelectItem>
                  <SelectItem value="3">Phase 3</SelectItem>
                  <SelectItem value="4">Phase 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Due Date</label>
            <input type="date" className="input-field" {...register('due_date')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Assign To</label>
            <Select onValueChange={(v) => setValue('assigned_to', v)} defaultValue="all">
              <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📢 All Students</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Task'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
