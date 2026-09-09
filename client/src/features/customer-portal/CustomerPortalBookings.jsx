import { Link } from 'react-router-dom'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Button } from '../../components/ui/Button'
import { ClipboardList } from 'lucide-react'

export function CustomerPortalBookings() {
  const { data, isLoading } = useGetBookingsQuery({ mine: true, limit: 50 })
  const bookings = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Bookings</h1>
        <Link to="/portal/bookings/new">
          <Button size="sm">New booking</Button>
        </Link>
      </div>
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : bookings.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No bookings" />
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <Link
              key={b._id}
              to={`/portal/bookings/${b._id}`}
              className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink-900">{b.bookingNumber}</p>
                <p className="text-sm text-ink-500">
                  {(b.pickup?.city || '—') + ' → ' + (b.delivery?.city || '—')}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
