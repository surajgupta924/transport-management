import { Link } from 'react-router-dom'
import { useGetTripsQuery } from '../trips/tripsApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { MapPinned } from 'lucide-react'

export function DriverTripsPage() {
  const { data, isLoading } = useGetTripsQuery({ limit: 50, mine: true })
  const trips = data?.data || []

  if (isLoading) return <TableSkeleton rows={4} />
  if (trips.length === 0) {
    return <EmptyState icon={MapPinned} title="No trips assigned" description="New assignments will appear here." />
  }

  return (
    <div className="space-y-3">
      <h1 className="font-display text-xl font-semibold text-ink-900">My trips</h1>
      {trips.map((t) => (
        <Link
          key={t._id}
          to={`/driver/trips/${t._id}`}
          className="block rounded-xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-ink-900">{t.tripNumber || t._id.slice(-6)}</p>
              <p className="mt-1 text-sm text-ink-500">
                {(t.booking?.pickup?.city || '—') + ' → ' + (t.booking?.delivery?.city || '—')}
              </p>
            </div>
            <StatusBadge status={t.status} />
          </div>
        </Link>
      ))}
    </div>
  )
}
