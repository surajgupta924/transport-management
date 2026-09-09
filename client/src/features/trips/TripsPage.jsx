import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import { useGetTripsQuery } from './tripsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export function TripsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(
    () => ({ page, limit: 10, search: search || undefined, status: status || undefined }),
    [page, search, status]
  )
  const { data, isLoading, isFetching } = useGetTripsQuery(queryArgs)
  const rows = data?.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader title="Trips" description="Assignment, status workflow, and live tracking" />
      <Card>
        <CardHeader
          title="Active & historical"
          action={
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search trip #..."
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                className="w-44"
              />
              <Select
                value={status}
                onChange={(e) => {
                  setPage(1)
                  setStatus(e.target.value)
                }}
                className="w-40"
              >
                <option value="">All status</option>
                <option value="PLANNED">Planned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="STARTED">Started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="IN_TRANSIT">In transit</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState icon={MapPinned} title="No trips" description="Trips appear when bookings are assigned." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Trip #</th>
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Driver</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((t) => (
                    <tr key={t._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium text-ink-900">{t.tripNumber || t._id.slice(-6)}</td>
                      <td className="px-5 py-3">{t.vehicle?.registrationNumber || t.vehicle?.regNo || '—'}</td>
                      <td className="px-5 py-3">{t.driver?.name || '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/app/trips/${t._id}`} className="font-medium text-brand-700 hover:underline">
                          Manage
                        </Link>
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
