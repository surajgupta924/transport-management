import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useCreateInvoiceMutation, useGetInvoicesQuery, useIssueInvoiceMutation } from './invoicesApi'
import { useGetCustomersQuery } from '../customers/customersApi'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, formatMoney } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  bookingId: z.string().optional(),
  amount: z.coerce.number().positive('Enter freight amount'),
  taxAmount: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  issueNow: z.boolean().optional(),
})

export function InvoicesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined, status: status || undefined }), [page, search, status])
  const { data, isLoading, isFetching } = useGetInvoicesQuery(queryArgs)
  const { data: customersData } = useGetCustomersQuery({ limit: 100, status: 'ACTIVE' })
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation()
  const [issueInvoice] = useIssueInvoiceMutation()
  const rows = data?.data || []
  const customers = customersData?.data || []
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { customerId: '', bookingId: '', amount: 0, taxAmount: 0, dueDate: '', notes: '', issueNow: true },
  })
  const customerId = watch('customerId')
  const { data: bookingsData } = useGetBookingsQuery(
    { customerId, limit: 50 },
    { skip: !customerId }
  )
  const bookings = bookingsData?.data || []

  const onCreate = async (values) => {
    try {
      const res = await createInvoice({
        customerId: values.customerId,
        bookingId: values.bookingId || undefined,
        amount: values.amount,
        taxAmount: values.taxAmount || 0,
        dueDate: values.dueDate || undefined,
        notes: values.notes,
        status: 'DRAFT',
      }).unwrap()
      const created = res.data
      if (values.issueNow && created?._id) {
        await issueInvoice({ id: created._id, status: 'ISSUED' }).unwrap()
      }
      toast.success(values.issueNow ? 'Invoice issued' : 'Draft invoice created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Billing"
        description="Create and issue customer invoices"
        action={
          <Can permission="invoices:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Create invoice'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="New invoice" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Select label="Customer" required error={errors.customerId?.message} {...register('customerId')}>
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.company ? `· ${c.company}` : ''}
                  </option>
                ))}
              </Select>
              <Select label="Booking (optional)" {...register('bookingId')}>
                <option value="">No booking</option>
                {bookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bookingNumber} · {b.pickup?.city || 'Pickup'} → {b.delivery?.city || 'Drop'}
                  </option>
                ))}
              </Select>
              <Input label="Freight amount" type="number" required error={errors.amount?.message} {...register('amount')} />
              <Input label="Tax amount" type="number" {...register('taxAmount')} />
              <Input label="Due date" type="date" {...register('dueDate')} />
              <Input label="Notes" {...register('notes')} />
              <label className="flex items-center gap-2 text-sm text-ink-700 md:col-span-2">
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300" {...register('issueNow')} />
                Issue immediately (customer can pay from the portal)
              </label>
              <div className="md:col-span-2">
                <Button type="submit" loading={creating}>Create billing</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          title="Invoice list"
          action={
            <div className="flex gap-2">
              <Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-44" />
              <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="w-36">
                <option value="">All status</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState title="No invoices" description="Create an invoice for a completed booking." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Invoice #</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium">{r.invoiceNumber || r._id.slice(-6)}</td>
                      <td className="px-5 py-3">{r.customer?.name || '—'}</td>
                      <td className="px-5 py-3">{formatMoney(r.totalAmount ?? r.amount)}</td>
                      <td className="px-5 py-3">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/app/invoices/${r._id}`} className="font-medium text-brand-700 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
