import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import {
  useCreateSettlementMutation,
  useGetSettlementsQuery,
  useSettleSettlementMutation,
} from './settlementsApi'
import { useGetDriversQuery } from '../drivers/driversApi'
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
  driverId: z.string().min(1),
  advanceGiven: z.coerce.number().min(0).optional(),
  advanceRecovered: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

export function SettlementsPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, isFetching } = useGetSettlementsQuery(queryArgs)
  const { data: driversData } = useGetDriversQuery({ limit: 100 })
  const [createSettlement, { isLoading: creating }] = useCreateSettlementMutation()
  const [settle, { isLoading: settling }] = useSettleSettlementMutation()
  const rows = data?.data || []
  const drivers = driversData?.data || []
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { driverId: '', advanceGiven: 0, advanceRecovered: 0, notes: '' },
  })

  const onCreate = async (values) => {
    try {
      await createSettlement(values).unwrap()
      toast.success('Settlement created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Driver settlements"
        description="Advances, recoveries, and expense close-out"
        action={
          <Can permission="expenses:approve">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'New settlement'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="Create settlement" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Select label="Driver" required error={errors.driverId?.message} {...register('driverId')}>
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Input label="Advance given" type="number" {...register('advanceGiven')} />
              <Input label="Advance recovered" type="number" {...register('advanceRecovered')} />
              <Input label="Notes" className="md:col-span-2" {...register('notes')} />
              <div className="md:col-span-2">
                <Button type="submit" loading={creating}>
                  Save draft
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader title="Settlements" />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="No settlements" description="Create a driver settlement to close expenses." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Driver</th>
                    <th className="px-5 py-3 font-medium">Net payable</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium">{r.driver?.name}</td>
                      <td className="px-5 py-3">{formatMoney(r.netPayable)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Can permission="expenses:approve">
                          {r.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              loading={settling}
                              onClick={async () => {
                                try {
                                  await settle({ id: r._id, status: 'SETTLED' }).unwrap()
                                  toast.success('Settled')
                                } catch (err) {
                                  toast.error(getErrorMessage(err))
                                }
                              }}
                            >
                              Mark settled
                            </Button>
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
