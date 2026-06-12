import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateIST, getPaymentStatusColor } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

export default async function StudentPaymentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', profile.id)
    .order('due_date', { ascending: false })

  const latestDue = payments?.find(p => p.status !== 'paid')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-muted-foreground mt-1">Your payment history</p>
        </div>
      </div>

      {latestDue && (
        <div className={`glass-card p-5 border-l-4 ${
          latestDue.status === 'overdue' ? 'border-l-red-400' : 'border-l-yellow-400'
        }`}>
          <p className="text-sm font-semibold">
            {latestDue.status === 'overdue' ? '⚠️ Payment Overdue' : '💳 Payment Due'}
          </p>
          <p className="text-2xl font-bold mt-1">
            ₹{Number(latestDue.amount).toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-muted-foreground">
            {latestDue.plan_type} · Due {formatDateIST(latestDue.due_date)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Contact your mentor to confirm payment.
          </p>
        </div>
      )}

      {!payments?.length ? (
        <div className="glass-card p-16 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No payment records</h3>
          <p className="text-sm text-muted-foreground">
            Your mentor will add payment details here.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
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
                    <td className="px-5 py-4 text-sm font-medium">{p.plan_type}</td>
                    <td className="px-5 py-4 text-sm font-mono">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{formatDateIST(p.due_date)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge-pill ${getPaymentStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
