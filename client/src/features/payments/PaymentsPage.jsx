import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCreatePaymentMutation, useGetPaymentSummaryQuery, useGetPaymentsQuery } from './paymentsApi'
import { useGetInvoicesQuery } from '../invoices/invoicesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal, StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

export function PaymentsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ invoiceId: '', amount: 0, method: 'UPI', reference: '', paidAt: '' })
  const { data, isLoading } = useGetPaymentsQuery({ page, limit: 10 })
  const { data: summaryData } = useGetPaymentSummaryQuery()
  const { data: invoicesData } = useGetInvoicesQuery({ limit: 100 })
  const [createPayment, { isLoading: creating }] = useCreatePaymentMutation()
  const rows = data?.data || []
  const summary = summaryData?.data || {}
  const invoices = (invoicesData?.data || []).filter((inv) => ['ISSUED', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (inv.amountDue || 0) > 0)

  const save = async () => {
    try {
      await createPayment({ ...form, amount: Number(form.amount), paidAt: form.paidAt || undefined }).unwrap()
      toast.success('Payment recorded')
      setOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="BILLING & COLLECTIONS"
        title="Payments"
        description="Record invoice collections, manage payment history, and track outstanding balances in real time."
        action={<Can permission="payments:create"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Record Payment</Button></Can>}
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total payments" value={summary.totalPayments || 0} />
        <StatCard label="Collected" value={formatMoney(summary.collected)} tone="green" />
        <StatCard label="Outstanding invoices" value={summary.outstandingInvoices || 0} tone="amber" />
        <StatCard label="Outstanding" value={formatMoney(summary.outstanding)} tone="violet" />
      </div>
      <Card>
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState title="There are no payment records yet" description="Select an outstanding invoice to record the first collection." />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p._id} className="border-t border-ink-50">
                    <td className="px-4 py-3">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{p.invoice?.invoiceNumber}</td>
                    <td className="px-4 py-3">{p.customer?.name}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">{p.reference || '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
      <Modal open={open} title="Record Payment" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Select label="Outstanding invoice" value={form.invoiceId} onChange={(e) => {
            const inv = invoices.find((i) => i._id === e.target.value)
            setForm((s) => ({ ...s, invoiceId: e.target.value, amount: inv?.amountDue || inv?.total || 0 }))
          }}>
            <option value="">Select invoice</option>
            {invoices.map((inv) => <option key={inv._id} value={inv._id}>{inv.invoiceNumber} · due {formatMoney(inv.amountDue)}</option>)}
          </Select>
          <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
          <Select label="Method" value={form.method} onChange={(e) => setForm((s) => ({ ...s, method: e.target.value }))}>
            {['UPI', 'CASH', 'NEFT', 'CHEQUE', 'CARD'].map((m) => <option key={m}>{m}</option>)}
          </Select>
          <Input label="Reference" value={form.reference} onChange={(e) => setForm((s) => ({ ...s, reference: e.target.value }))} />
          <Input label="Payment date" type="date" value={form.paidAt} onChange={(e) => setForm((s) => ({ ...s, paidAt: e.target.value }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={creating} onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
