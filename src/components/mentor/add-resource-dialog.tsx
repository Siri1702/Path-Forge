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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'

interface Student { id: string; name: string }

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['Video', 'Article', 'Project', 'Practice']),
  phase_tag: z.string().optional(),
  assigned_to: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function AddResourceDialog({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Article' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: mentor } = await supabase
        .from('profiles').select('id').eq('user_id', user!.id).single()

      const payload = {
        title: data.title,
        url: data.url,
        type: data.type,
        phase_tag: data.phase_tag ? parseInt(data.phase_tag) : null,
        assigned_to: data.assigned_to === 'all' || !data.assigned_to ? null : data.assigned_to,
        created_by: mentor!.id,
      }

      const { error } = await supabase.from('resources').insert(payload)
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }

      // Notify relevant students
      let targetIds: string[] = []
      if (!data.assigned_to || data.assigned_to === 'all') {
        targetIds = students.map(s => s.id)
      } else {
        targetIds = [data.assigned_to]
      }

      if (targetIds.length > 0) {
        await supabase.from('notifications').insert(
          targetIds.map(id => ({
            user_id: id,
            type: 'resource_added',
            message: `New resource added: "${data.title}"`,
            link: '/dashboard/student/resources',
          }))
        )
      }

      toast({ title: 'Resource added!', description: 'Students can now access it in their library.' })
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
        <button className="btn-primary"><Plus className="w-4 h-4" /> Add Resource</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <input className="input-field" placeholder="e.g. Intro to Pandas (Video)" {...register('title')} />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL *</label>
            <input className="input-field" type="url" placeholder="https://..." {...register('url')} />
            {errors.url && <p className="text-xs text-red-400">{errors.url.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select onValueChange={(v) => setValue('type', v as any)} defaultValue="Article">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">🎥 Video</SelectItem>
                  <SelectItem value="Article">📄 Article</SelectItem>
                  <SelectItem value="Project">🛠 Project</SelectItem>
                  <SelectItem value="Practice">💻 Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phase</label>
              <Select onValueChange={(v) => setValue('phase_tag', v)}>
                <SelectTrigger><SelectValue placeholder="Any phase" /></SelectTrigger>
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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Resource'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
