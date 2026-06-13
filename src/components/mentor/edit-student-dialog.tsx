'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Pencil } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  track: z.enum(['ML Engineer', 'Data Scientist', 'Data Analyst']),
  current_phase: z.string(),
  bio: z.string().max(300, 'Bio max 300 chars').optional(),
})
type FormData = z.infer<typeof schema>

interface Student {
  id: string
  name: string
  email: string
  track?: string
  current_phase?: number
  bio?: string
}

export function EditStudentDialog({ student }: { student: Student }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: student.name,
      track: (student.track as any) ?? 'Data Scientist',
      current_phase: String(student.current_phase ?? 1),
      bio: student.bio ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          track: data.track,
          current_phase: parseInt(data.current_phase),
          bio: data.bio || null,
        })
        .eq('id', student.id)

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Student updated!', description: `${data.name}'s profile has been saved.` })
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-secondary text-sm">
          <Pencil className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit student profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name *</label>
            <input className="input-field" {...register('name')} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input className="input-field opacity-50 cursor-not-allowed" value={student.email} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Track</label>
              <Select
                onValueChange={(v) => setValue('track', v as any)}
                defaultValue={student.track ?? 'Data Scientist'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ML Engineer">ML Engineer</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                  <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current Phase</label>
              <Select
                onValueChange={(v) => setValue('current_phase', v)}
                defaultValue={String(student.current_phase ?? 1)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <label className="text-sm font-medium">Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              className="input-field h-20 resize-none"
              placeholder="A short note about this student's background or goals..."
              {...register('bio')}
            />
            {errors.bio && <p className="text-xs text-red-400">{errors.bio.message}</p>}
          </div>

          <DialogFooter className="mt-6">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : 'Save Changes'
              }
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
