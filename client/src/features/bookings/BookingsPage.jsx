import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { useGetBookingsQuery } from './bookingsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Can } from '../../hooks/usePermission'

export function BookingsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      status: status || undefined,
      source: source || undefined,
    }),
    [page, search, status, source]
  )
  const { data, isLoading, isFetching } = useGetBookingsQuery(queryArgs)
  const rows = data?.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Bookings"
        description="Online and offline freight bookings"
        action={
          <Can permission="bookings:create">
            <Link to="/app/bookings/new">
              <Button>
                <Plus className="h-4 w-4" />
                New booking
              </Button>
            </Link>
          </Can>
        }
      />
      <Card>
        <CardHeader
          title="Orders"
          action={
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search booking #..."
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                className="w-44"
              />
              <Select
                value={source}
                onChange={(e) => {
                  setPage(1)
                  setSource(e.target.value)
                }}
                className="w-36"
              >
                <option value="">All sources</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <Select
                value={status}
                onChange={(e) => {
                  setPage(1)
                  setStatus(e.target.value)
                }}
                className="w-40"
              >
                <option value="">All status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ASSIGNED">Assigned</option>
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
            <EmptyState icon={ClipboardList} title="No bookings" description="Create an online or offline booking." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Booking #</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Route</th>
                    <th className="px-5 py-3 font-medium">Source</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((b) => (
                    <tr key={b._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium text-ink-900">{b.bookingNumber || b._id.slice(-6)}</td>
                      <td className="px-5 py-3">{b.customer?.name || b.customerName || '—'}</td>
                      <td className="px-5 py-3 text-ink-600">
                        {(b.pickup?.city || b.pickupCity || '—') + ' → ' + (b.delivery?.city || b.destinationCity || '—')}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.source} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-3">{b.charges?.total ?? b.totalAmount ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/app/bookings/${b._id}`} className="font-medium text-brand-700 hover:underline">
                          View
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
