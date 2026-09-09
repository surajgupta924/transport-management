import { Link } from 'react-router-dom'
import { useGetTripsQuery } from '../trips/tripsApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/common/EmptyState'

export function DriverDashboardPage() {
  const { data, isLoading } = useGetTripsQuery({ limit: 5, mine: true })
  const trips = data?.data || []
  const active = trips.find((t) => ['ASSIGNED', 'STARTED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(t.status))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Today</h1>
        <p className="text-sm text-ink-500">Your assigned trips and actions</p>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : active ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-semibold text-ink-900">
                  {active.tripNumber || 'Active trip'}
                </p>
                <StatusBadge status={active.status} />
              </div>
              <p className="text-sm text-ink-600">
                {(active.booking?.pickup?.city || 'Pickup') + ' → ' + (active.booking?.delivery?.city || 'Drop')}
              </p>
              <Link to="/driver/active">
                <Button className="w-full">Open active trip</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-ink-900">No active trip</p>
              <p className="text-sm text-ink-500">Check Trips for upcoming assignments.</p>
              <Link to="/driver/trips">
                <Button variant="secondary" className="w-full">
                  View trips
                </Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Quick to="/driver/bookings/new" label="Book for client" />
        <Quick to="/driver/expenses" label="Log expense" />
        <Quick to="/driver/pod" label="Submit POD" />
        <Quick to="/driver/profile" label="Profile" />
      </div>
    </div>
  )
}

function Quick({ to, label }) {
  return (
    <Link to={to} className="rounded-xl border border-ink-200 bg-white px-4 py-5 text-center text-sm font-medium text-ink-800 shadow-[var(--shadow-card)]">
      {label}
    </Link>
  )
}
