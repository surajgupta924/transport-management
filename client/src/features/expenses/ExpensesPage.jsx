import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useApproveExpenseMutation, useCreateExpenseMutation, useGetExpensesQuery, useRejectExpenseMutation } from './expensesApi'
import { useUploadFilesMutation } from '../uploads/uploadsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, mediaUrl } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  tripId: z.string().optional(),
  date: z.string().optional(),
  description: z.string().min(2),
  receiptUrl: z.string().optional(),
})

export function ExpensesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined, status: status || undefined }), [page, search, status])
  const { data, isLoading, isFetching } = useGetExpensesQuery(queryArgs)
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation()
  const [uploadFiles, { isLoading: uploading }] = useUploadFilesMutation()
  const [approveExpense, { isLoading: approving }] = useApproveExpenseMutation()
  const [rejectExpense, { isLoading: rejecting }] = useRejectExpenseMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: 'TOLL', amount: 0, vehicleId: '', driverId: '', tripId: '', date: '', description: '', receiptUrl: '' },
  })
  const receiptUrl = watch('receiptUrl')

  const onCreate = async (values) => {
    try {
      await createExpense({
        ...values,
        title: values.description,
        notes: values.description,
        vehicleId: values.vehicleId || undefined,
        driverId: values.driverId || undefined,
        tripId: values.tripId || undefined,
        date: values.date || undefined,
        receiptUrl: values.receiptUrl || undefined,
      }).unwrap()
      toast.success('Expense submitted')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Expenses"
        description="Operational expenses with approve / reject"
        action={
          <Can permission="expenses:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Add expense'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="Submit expense" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Select label="Category" {...register('category')}>
                <option value="FUEL">Fuel</option>
                <option value="TOLL">Toll</option>
                <option value="PARKING">Parking</option>
                <option value="FOOD">Food</option>
                <option value="REPAIR">Repair</option>
                <option value="OTHER">Other</option>
              </Select>
              <Input label="Amount" type="number" required error={errors.amount?.message} {...register('amount')} />
              <Input label="Vehicle ID" {...register('vehicleId')} />
              <Input label="Driver ID" {...register('driverId')} />
              <Input label="Trip ID" {...register('tripId')} />
              <Input label="Date" type="date" {...register('date')} />
              <Textarea label="Description" className="md:col-span-2" required error={errors.description?.message} {...register('description')} />
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-ink-700">Receipt</label>
                <input
                  type="file"
                  accept="image/*,application/pdf,capture=camera"
                  capture="environment"
                  className="block w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const res = await uploadFiles({ files: [file], folder: 'receipts' }).unwrap()
                      const url = res.data?.[0]?.url
                      if (url) {
                        setValue('receiptUrl', url)
                        toast.success('Receipt uploaded')
                      }
                    } catch (err) {
                      toast.error(getErrorMessage(err))
                    }
                  }}
                />
                {receiptUrl && (
                  <a href={mediaUrl(receiptUrl)} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700">
                    View uploaded receipt
                  </a>
                )}
              </div>
              <div className="md:col-span-2"><Button type="submit" loading={creating || uploading}>Submit</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          title="Expense list"
          action={
            <div className="flex gap-2">
              <Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-44" />
              <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="w-36">
                <option value="">All status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState title="No expenses" description="Submit an expense to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Receipt</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium">{r.category}</td>
                      <td className="px-5 py-3 text-ink-600">{r.description}</td>
                      <td className="px-5 py-3">{r.amount}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3">
                        {r.receiptUrl ? (
                          <a href={mediaUrl(r.receiptUrl)} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">View</a>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Can permission="expenses:approve">
                          {r.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="secondary" loading={approving} onClick={async () => {
                                try { await approveExpense({ id: r._id }).unwrap(); toast.success('Approved') }
                                catch (err) { toast.error(getErrorMessage(err)) }
                              }}>Approve</Button>
                              <Button size="sm" variant="danger" loading={rejecting} onClick={async () => {
                                try { await rejectExpense({ id: r._id }).unwrap(); toast.success('Rejected') }
                                catch (err) { toast.error(getErrorMessage(err)) }
                              }}>Reject</Button>
                            </div>
                          )}
                        </Can>
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
