import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useGetMaintenanceRecordsQuery, useCreateMaintenanceRecordMutation, useApproveMaintenanceRecordMutation } from './maintenanceApi'
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
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  vehicleId: z.string().min(1),
  vendorId: z.string().optional(),
  type: z.string().min(1),
  cost: z.coerce.number().min(0),
  date: z.string().optional(),
  description: z.string().min(2),
})

export function MaintenancePage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined, status: status || undefined }), [page, search, status])
  const { data, isLoading, isFetching } = useGetMaintenanceRecordsQuery(queryArgs)
  const [createItem, { isLoading: creating }] = useCreateMaintenanceRecordMutation()
  const [approveItem, { isLoading: approving }] = useApproveMaintenanceRecordMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {"vehicleId":"","vendorId":"","type":"SERVICE","cost":0,"date":"","description":""},
  })

  const onCreate = async (values) => {
    try {
      await createItem(values).unwrap()
      toast.success('Record created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Maintenance"
        description="Workshop jobs and service records"
        action={
          <Can permission="maintenance:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Add record'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="New record" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Vehicle ID" required {...register('vehicleId')} />
              <Input label="Vendor ID" {...register('vendorId')} />
              <Select label="Type" {...register('type')}>
                <option value="SERVICE">Service</option>
                <option value="REPAIR">Repair</option>
                <option value="TYRE">Tyre</option>
                <option value="OTHER">Other</option>
              </Select>
              <Input label="Cost" type="number" {...register('cost')} />
              <Input label="Date" type="date" {...register('date')} />
              <Textarea label="Description" className="md:col-span-2" required error={errors.description?.message} {...register('description')} />
              <div className="md:col-span-2">
                <Button type="submit" loading={creating}>Save</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          title="Records"
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
            <EmptyState title="No records" description="Nothing to show yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3">{r.date ? new Date(r.date).toLocaleDateString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-900">{r.vehicle?.registrationNumber || r.vehicle?.regNo || r.category || r.type || r.title || 'Record'}</p>
                        <p className="text-xs text-ink-500">{r.description || r.notes || r.vendor?.name || ''}</p>
                      </td>
                      <td className="px-5 py-3">{r.amount ?? r.totalAmount ?? r.cost ?? '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status || r.approvalStatus} /></td>
                      <td className="px-5 py-3 text-right">
                        <Can permission="maintenance:approve">
                          {(r.status === 'PENDING' || r.approvalStatus === 'PENDING') && (
                            <Button size="sm" variant="secondary" loading={approving} onClick={async () => {
                              try { await approveItem(r._id).unwrap(); toast.success('Approved') }
                              catch (err) { toast.error(getErrorMessage(err)) }
                            }}>Approve</Button>
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
