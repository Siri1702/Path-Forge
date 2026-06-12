import { createClient } from '@/lib/supabase/server'
import { formatDateIST, getPaymentStatusColor } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

interface Props { studentId: string }

export async function StudentPaymentsTab({ studentId }: Props) {
  const supabase = createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
    .order('due_date', { ascending: false })

  if (!payments?.length) {
    return (
      <div className="glass-card p-12 text-center">
        <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No payment records yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
              <td className="px-5 py-3.5 text-sm font-medium">{p.plan_type}</td>
              <td className="px-5 py-3.5 text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</td>
              <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDateIST(p.due_date)}</td>
              <td className="px-5 py-3.5">
                <span className={`badge-pill ${getPaymentStatusColor(p.status)}`}>{p.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
