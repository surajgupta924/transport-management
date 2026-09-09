import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Button } from '../../components/ui/Button'

export function PortalBookingsPage() {
  const { data, isLoading } = useGetBookingsQuery({ limit: 50, mine: true })
  const rows = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-xl font-semibold text-ink-900">Bookings</h1>
        <Link to="/portal/bookings/new">
          <Button size="sm">New</Button>
        </Link>
      </div>
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No bookings" description="Create a booking to move cargo." />
      ) : (
        rows.map((b) => (
          <Link
            key={b._id}
            to={`/portal/bookings/${b._id}`}
            className="block rounded-xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink-900">{b.bookingNumber}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {(b.pickup?.city || 'Pickup') + ' → ' + (b.delivery?.city || 'Drop')}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
