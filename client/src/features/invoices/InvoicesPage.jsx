import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useCreateInvoiceMutation, useGetInvoiceSummaryQuery, useGetInvoicesQuery, useIssueInvoiceMutation } from './invoicesApi'
import { useGetCustomersQuery } from '../customers/customersApi'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal, StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

export function InvoicesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ customerId: '', bookingId: '', amount: 0, taxPercent: 18, dueDate: '', issueNow: true })
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined, status: status || undefined }), [page, search, status])
  const { data, isLoading } = useGetInvoicesQuery(queryArgs)
  const { data: summaryData } = useGetInvoiceSummaryQuery()
  const { data: customersData } = useGetCustomersQuery({ limit: 100, status: 'ACTIVE' })
  const { data: bookingsData } = useGetBookingsQuery({ customerId: form.customerId, limit: 50 }, { skip: !form.customerId })
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation()
  const [issueInvoice] = useIssueInvoiceMutation()
  const rows = data?.data || []
  const summary = summaryData?.data || {}
  const customers = customersData?.data || []
  const bookings = bookingsData?.data || []
  const apiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

  const save = async () => {
    try {
      const res = await createInvoice({
        customerId: form.customerId,
        bookingId: form.bookingId || undefined,
        fromBooking: Boolean(form.bookingId),
        amount: Number(form.amount) || undefined,
        taxPercent: Number(form.taxPercent) || 0,
        dueDate: form.dueDate || undefined,
      }).unwrap()
      if (form.issueNow && res.data?._id) await issueInvoice({ id: res.data._id, status: 'ISSUED' }).unwrap()
      toast.success('Invoice created')
      setOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="BILLING & COLLECTIONS"
        title="Invoices"
        description="Create accurate invoices from completed shipment charges, manage invoice status, and generate printable copies."
        action={<Can permission="invoices:create"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Invoice</Button></Can>}
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total invoices" value={summary.totalInvoices || 0} tone="violet" />
        <StatCard label="Issued" value={summary.issued || 0} tone="amber" />
        <StatCard label="Paid" value={summary.paid || 0} tone="green" />
        <StatCard label="Total amount" value={formatMoney(summary.totalAmount)} tone="violet" />
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search invoice number, shipment..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="w-48">
          <option value="">All invoice statuses</option>
          {['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <Card>
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? <EmptyState title="No invoices" /> : (
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Shipment / Route</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Subtotal</th>
                  <th className="px-4 py-3 text-left">GST</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => (
                  <tr key={inv._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">{inv.booking?.bookingNumber || inv.booking?.shipmentNumber || '—'}</td>
                    <td className="px-4 py-3">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{formatMoney(inv.subtotal)}</td>
                    <td className="px-4 py-3">{formatMoney(inv.taxAmount)}</td>
                    <td className="px-4 py-3 font-medium">{formatMoney(inv.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <a className="text-sm font-medium text-blue-700" href={`${apiBase}/invoices/${inv._id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
      <Modal open={open} title="Create Invoice" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Select label="Customer" value={form.customerId} onChange={(e) => setForm((s) => ({ ...s, customerId: e.target.value }))}>
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select label="Shipment" value={form.bookingId} onChange={(e) => setForm((s) => ({ ...s, bookingId: e.target.value }))}>
            <option value="">Optional - pull charges from shipment</option>
            {bookings.map((b) => <option key={b._id} value={b._id}>{b.shipmentNumber || b.bookingNumber} · {formatMoney(b.charges?.total)}</option>)}
          </Select>
          <Input label="Amount (if not from shipment)" type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
          <Input label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.issueNow} onChange={(e) => setForm((s) => ({ ...s, issueNow: e.target.checked }))} /> Issue immediately</label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={creating} onClick={save}>Create</Button>
        </div>
      </Modal>
    </div>
  )
}
