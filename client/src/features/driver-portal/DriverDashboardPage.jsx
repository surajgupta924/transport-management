import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ClipboardList,
  FileCheck2,
  Navigation,
  Radio,
  Truck,
  Wallet,
} from 'lucide-react'
import { selectCurrentUser } from '../auth/authSlice'
import { useGetTripsQuery } from '../trips/tripsApi'
import { useGetExpensesQuery } from '../expenses/expensesApi'
import { useGetPodsQuery } from '../pod/podApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/OpsUi'
import { Skeleton } from '../../components/common/EmptyState'

function shipmentOf(trip) {
  return trip?.booking?.shipmentNumber || trip?.booking?.bookingNumber || trip?.tripNumber || 'Shipment'
}

function routeOf(trip) {
  return `${trip?.booking?.pickup?.city || 'Pickup'} → ${trip?.booking?.delivery?.city || 'Drop'}`
}

function isAwaiting(trip) {
  return ['ASSIGNED', 'PENDING_APPROVAL'].includes(trip.assignmentStatus) && trip.assignmentStatus !== 'ACCEPTED'
}

export function DriverDashboardPage() {
  const user = useSelector(selectCurrentUser)
  const { data, isLoading } = useGetTripsQuery({ limit: 50, mine: true })
  const { data: expenseData } = useGetExpensesQuery({ limit: 20, mine: true })
  const { data: podData } = useGetPodsQuery({ limit: 20 })
  const trips = data?.data || []
  const awaiting = trips.filter(isAwaiting)
  const accepted = trips.filter((t) => t.assignmentStatus === 'ACCEPTED')
  const live = trips.filter(
    (t) =>
      t.assignmentStatus === 'ACCEPTED' &&
      !['COMPLETED', 'CANCELLED'].includes(t.status) &&
      t.assignmentStatus !== 'RELEASED'
  )
  const next = awaiting[0] || live[0] || accepted[0]
  const pendingExpenses = (expenseData?.data || []).filter((item) => item.status === 'PENDING').length
  const pendingPods = (podData?.data || []).filter((item) => ['PENDING', 'UPLOADED'].includes(item.status)).length
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        eyebrow="Driver workspace"
        title={`${hello}, ${(user?.name || 'driver').split(' ')[0]}`}
        description="Accept assignments, share live GPS, log trip expenses, and close deliveries with POD."
        action={
          <Link to="/driver/active">
            <Button>
              <Radio className="h-4 w-4" />
              Open live deliveries
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting decision" value={awaiting.length} tone="blue" icon={ClipboardList} />
        <StatCard label="Accepted trips" value={accepted.length} tone="green" icon={Truck} />
        <StatCard label="Pending expenses" value={pendingExpenses} tone="amber" icon={Wallet} />
        <StatCard label="POD in review" value={pendingPods} tone="violet" icon={FileCheck2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 px-6 py-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">Next action</p>
            {isLoading ? (
              <Skeleton className="mt-3 h-16 w-full bg-white/20" />
            ) : next ? (
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold">{shipmentOf(next)}</p>
                  <p className="mt-1 text-sm text-blue-100">{routeOf(next)}</p>
                  <p className="mt-1 text-xs text-blue-200">
                    {next.vehicle?.registrationNumber || 'Vehicle pending'} · {next.driver?.name || user?.name}
                  </p>
                </div>
                <StatusBadge status={next.assignmentStatus || next.status} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-blue-100">No assignment waiting. New trips will appear here as soon as operations assigns you.</p>
            )}
          </div>
          <CardBody className="flex flex-wrap gap-2">
            {next && isAwaiting(next) ? (
              <Link to="/driver/trips">
                <Button>Review assignment</Button>
              </Link>
            ) : null}
            {next && next.assignmentStatus === 'ACCEPTED' ? (
              <Link to="/driver/active">
                <Button>
                  <Navigation className="h-4 w-4" />
                  Ready for trip
                </Button>
              </Link>
            ) : null}
            <Link to="/driver/trips">
              <Button variant="secondary">My assignments</Button>
            </Link>
            <Link to="/driver/expenses">
              <Button variant="secondary">Log expense</Button>
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Quick launch</p>
            {[
              { to: '/driver/trips', icon: ClipboardList, label: 'My Assignments', hint: 'Accept or reject new trips' },
              { to: '/driver/expenses', icon: Wallet, label: 'My Trip Expenses', hint: 'Fuel, toll, parking, repair' },
              { to: '/driver/active', icon: Radio, label: 'My Live Deliveries', hint: 'Start GPS and trip execution' },
              { to: '/driver/pod', icon: FileCheck2, label: 'POD / Delivery Closure', hint: 'Upload proof after arrival' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink-900">{item.label}</span>
                  <span className="block text-xs text-ink-500">{item.hint}</span>
                </span>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
