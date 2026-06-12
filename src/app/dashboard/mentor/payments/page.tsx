import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateIST, getPaymentStatusColor } from '@/lib/utils'
import { AddPaymentDialog } from '@/components/mentor/add-payment-dialog'
import { PaymentStatusToggle } from '@/components/mentor/payment-status-toggle'
import { CreditCard } from 'lucide-react'

export default async function MentorPaymentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: payments }, { data: students }] = await Promise.all([
    supabase
      .from('payments')
      .select('*, profiles!payments_student_id_fkey(name, email)')
      .order('due_date', { ascending: true }),
    supabase.from('profiles').select('id, name').eq('role', 'student'),
  ])

  const overdue = payments?.filter(p => p.status === 'overdue').length ?? 0
  const pending = payments?.filter(p => p.status === 'pending').length ?? 0
  const paid = payments?.filter(p => p.status === 'paid').length ?? 0

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-muted-foreground mt-1">
            {overdue > 0 && <span className="text-red-400">{overdue} overdue · </span>}
            {pending} pending · {paid} paid
          </p>
        </div>
        <AddPaymentDialog students={students ?? []} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Overdue', count: overdue, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Pending', count: pending, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Paid', count: paid, color: 'text-green-400', bg: 'bg-green-400/10' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {!payments?.length ? (
        <div className="glass-card p-16 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No payment records</h3>
          <p className="text-sm text-muted-foreground mb-6">Add payment records for your students.</p>
          <AddPaymentDialog students={students ?? []} />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{(p.profiles as any)?.name}</p>
                      <p className="text-xs text-muted-foreground">{(p.profiles as any)?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.plan_type}</td>
                    <td className="px-5 py-4 text-sm font-mono">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDateIST(p.due_date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge-pill ${getPaymentStatusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground max-w-[160px] truncate">
                      {p.notes || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <PaymentStatusToggle paymentId={p.id} currentStatus={p.status} />
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
