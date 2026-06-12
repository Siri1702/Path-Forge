'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'

interface Student { id: string; name: string }

const schema = z.object({
  student_id: z.string().min(1, 'Select a student'),
  plan_type: z.string().min(1, 'Plan type required'),
  amount: z.string().min(1, 'Amount required'),
  due_date: z.string().min(1, 'Due date required'),
  status: z.enum(['paid', 'pending', 'overdue']),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function AddPaymentDialog({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('payments').insert({
        student_id: data.student_id,
        plan_type: data.plan_type,
        amount: parseFloat(data.amount),
        due_date: data.due_date,
        status: data.status,
        notes: data.notes || null,
      })

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Payment record added!' })
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
        <button className="btn-primary"><Plus className="w-4 h-4" /> Add Record</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add payment record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Student *</label>
            <Select onValueChange={(v) => setValue('student_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.student_id && <p className="text-xs text-red-400">{errors.student_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plan Type *</label>
            <input className="input-field" placeholder="e.g. 3-Month Mentorship" {...register('plan_type')} />
            {errors.plan_type && <p className="text-xs text-red-400">{errors.plan_type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (₹) *</label>
              <input className="input-field" type="number" placeholder="15000" {...register('amount')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select onValueChange={(v) => setValue('status', v as any)} defaultValue="pending">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">✅ Paid</SelectItem>
                  <SelectItem value="pending">🟡 Pending</SelectItem>
                  <SelectItem value="overdue">🔴 Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Due Date *</label>
            <input type="date" className="input-field" {...register('due_date')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <input className="input-field" placeholder="e.g. Paid via UPI" {...register('notes')} />
          </div>

          <DialogFooter className="mt-6">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Record'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
