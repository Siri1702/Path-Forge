'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  paymentId: string
  currentStatus: string
}

export function PaymentStatusToggle({ paymentId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', paymentId)

    setLoading(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Payment status updated' })
      router.refresh()
    }
  }

  return (
    <Select onValueChange={handleChange} defaultValue={currentStatus} disabled={loading}>
      <SelectTrigger className="h-8 text-xs w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paid">✅ Paid</SelectItem>
        <SelectItem value="pending">🟡 Pending</SelectItem>
        <SelectItem value="overdue">🔴 Overdue</SelectItem>
      </SelectContent>
    </Select>
  )
}
