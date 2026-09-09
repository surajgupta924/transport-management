import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useCreatePaymentMutation, useGetPaymentsQuery } from './paymentsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  customerId: z.string().min(1),
  invoiceId: z.string().optional(),
  amount: z.coerce.number().positive(),
  method: z.enum(['CASH', 'UPI', 'NEFT', 'CHEQUE', 'CARD']),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
})

export function PaymentsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, isFetching } = useGetPaymentsQuery(queryArgs)
  const [createPayment, { isLoading: creating }] = useCreatePaymentMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { customerId: '', invoiceId: '', amount: 0, method: 'UPI', reference: '', paidAt: '' },
  })

  const onCreate = async (values) => {
    try {
      await createPayment(values).unwrap()
      toast.success('Payment recorded')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Payments"
        description="Incoming payment collection"
        action={
          <Can permission="payments:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Record payment'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="New payment" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Customer ID" required error={errors.customerId?.message} {...register('customerId')} />
              <Input label="Invoice ID" {...register('invoiceId')} />
              <Input label="Amount" type="number" required {...register('amount')} />
              <Select label="Method" {...register('method')}>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Card</option>
              </Select>
              <Input label="Reference" {...register('reference')} />
              <Input label="Paid at" type="datetime-local" {...register('paidAt')} />
              <div className="md:col-span-2"><Button type="submit" loading={creating}>Save payment</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader title="Payment history" action={<Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-48" />} />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState title="No payments" description="Record a payment against an invoice." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Method</th>
                    <th className="px-5 py-3 font-medium">When</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium">{r.customer?.name || '—'}</td>
                      <td className="px-5 py-3">{r.amount}</td>
                      <td className="px-5 py-3">{r.method}</td>
                      <td className="px-5 py-3">{r.paidAt ? new Date(r.paidAt).toLocaleString() : '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status || 'PAID'} /></td>
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
