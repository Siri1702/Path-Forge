'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send } from 'lucide-react'

interface Student { id: string; name: string }

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  body: z.string().min(5, 'Message body required'),
  target: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function PostAnnouncementForm({ students }: { students: Student[] }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: mentor } = await supabase.from('profiles').select('id').eq('user_id', user!.id).single()

      const payload = {
        title: data.title,
        body: data.body,
        created_by: mentor!.id,
        target: data.target === 'all' || !data.target ? null : data.target,
      }

      const { error } = await supabase.from('announcements').insert(payload)
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }

      // Notify students
      let targetIds: string[] = []
      if (!data.target || data.target === 'all') {
        targetIds = students.map(s => s.id)
      } else {
        targetIds = [data.target]
      }

      if (targetIds.length > 0) {
        await supabase.from('notifications').insert(
          targetIds.map(id => ({
            user_id: id,
            type: 'announcement',
            message: `📢 New announcement: "${data.title}"`,
            link: '/dashboard/student',
          }))
        )
      }

      toast({ title: 'Announcement posted!', description: `Sent to ${targetIds.length} student(s)` })
      reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-6">
      <p className="font-semibold mb-4">New Announcement</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title *</label>
          <input className="input-field" placeholder="e.g. Session rescheduled to Friday" {...register('title')} />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Message *</label>
          <textarea
            className="input-field h-28 resize-none"
            placeholder="Write your announcement..."
            {...register('body')}
          />
          {errors.body && <p className="text-xs text-red-400">{errors.body.message}</p>}
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium">Send To</label>
            <Select onValueChange={(v) => setValue('target', v)} defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📢 All Students</SelectItem>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting</> : <><Send className="w-4 h-4" /> Post</>}
          </button>
        </div>
      </form>
    </div>
  )
}
