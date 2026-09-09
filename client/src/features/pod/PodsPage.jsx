import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useCreatePodMutation, useGetPodsQuery } from './podApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  tripId: z.string().min(1),
  bookingId: z.string().optional(),
  receivedBy: z.string().min(2),
  deliveredAt: z.string().optional(),
  remarks: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
})

export function PodsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, isFetching } = useGetPodsQuery(queryArgs)
  const [createPod, { isLoading: creating }] = useCreatePodMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { tripId: '', bookingId: '', receivedBy: '', deliveredAt: '', remarks: '', photoUrl: '' },
  })

  const onCreate = async (values) => {
    try {
      await createPod({ ...values, photoUrl: values.photoUrl || undefined }).unwrap()
      toast.success('POD created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Proof of Delivery"
        description="Delivery confirmations and recipient details"
        action={
          <Can permission="pod:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Add POD'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="Capture POD" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Trip ID" required error={errors.tripId?.message} {...register('tripId')} />
              <Input label="Booking ID" {...register('bookingId')} />
              <Input label="Received by" required error={errors.receivedBy?.message} {...register('receivedBy')} />
              <Input label="Delivered at" type="datetime-local" {...register('deliveredAt')} />
              <Input label="Photo URL" className="md:col-span-2" error={errors.photoUrl?.message} {...register('photoUrl')} />
              <Textarea label="Remarks" className="md:col-span-2" {...register('remarks')} />
              <div className="md:col-span-2"><Button type="submit" loading={creating}>Save POD</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader title="POD records" action={<Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-48" />} />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState title="No POD records" description="Capture a delivery proof when trips complete." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Trip</th>
                    <th className="px-5 py-3 font-medium">Received by</th>
                    <th className="px-5 py-3 font-medium">When</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium">{r.trip?.tripNumber || r.tripId || '—'}</td>
                      <td className="px-5 py-3">{r.receivedBy}</td>
                      <td className="px-5 py-3">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status || 'COMPLETED'} /></td>
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
