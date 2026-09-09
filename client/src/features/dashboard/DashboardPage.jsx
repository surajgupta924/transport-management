import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { selectCurrentUser } from '../auth/authSlice'
import { useGetDashboardQuery } from './dashboardApi'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { formatMoney } from '../../lib/utils'
import {
  Truck,
  Users,
  MapPinned,
  ClipboardList,
  Wallet,
  FileText,
} from 'lucide-react'

const CHART_COLORS = ['#d97706', '#0f172a', '#0ea5e9', '#059669', '#b45309', '#64748b']

function chartRows(list, fallbackName = 'Unknown') {
  return (list || []).map((row) => ({
    name: row._id || row.name || fallbackName,
    value: Number(row.count ?? row.value ?? 0),
  }))
}

export function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const { data, isLoading } = useGetDashboardQuery()
  const stats = data?.data
  const counts = stats?.counts || {}
  const finance = stats?.finance || {}
  const sourceChart = chartRows(stats?.charts?.bookingsBySource)
  const statusChart = chartRows(stats?.charts?.tripsByStatus)

  const kpis = [
    { label: 'Vehicles', value: counts.vehicles ?? 0, icon: Truck, hint: 'Fleet units' },
    { label: 'Drivers', value: counts.drivers ?? 0, icon: Users, hint: 'Active drivers' },
    { label: 'Active trips', value: counts.activeTrips ?? 0, icon: MapPinned, hint: 'On the road' },
    { label: 'Bookings today', value: counts.bookingsToday ?? 0, icon: ClipboardList, hint: 'Created today' },
    { label: 'Outstanding', value: formatMoney(finance.outstanding), icon: Wallet, hint: 'Open invoices' },
    { label: 'Open invoices', value: counts.openInvoices ?? 0, icon: FileText, hint: 'Issued / partial' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Good day, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Live operations snapshot across fleet, bookings, and finance.</p>
        </div>
        <Badge tone="brand">{user?.role?.name}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardBody className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-ink-900">
                  {isLoading ? '…' : item.value}
                </p>
                <p className="mt-1 text-xs text-ink-400">{item.hint}</p>
              </div>
              <div className="rounded-lg bg-ink-100 p-2 text-ink-600">
                <item.icon className="h-5 w-5" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Finance" description="Billed vs collected" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Billed" value={formatMoney(finance.billed)} />
            <Row label="Collected" value={formatMoney(finance.collected)} />
            <Row label="Outstanding" value={formatMoney(finance.outstanding)} />
            <Row label="Customers" value={counts.customers ?? 0} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Bookings by source" />
          <CardBody className="h-56">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : sourceChart.length === 0 ? (
              <p className="text-sm text-ink-500">No booking source data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sourceChart.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Trips by status" />
          <CardBody className="h-56">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : statusChart.length === 0 ? (
              <p className="text-sm text-ink-500">No trip status data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusChart.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent bookings"
            action={
              <Link to="/app/bookings" className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {(stats?.recentBookings || []).length === 0 ? (
              <p className="text-sm text-ink-500">No bookings yet.</p>
            ) : (
              stats.recentBookings.map((b) => (
                <Link
                  key={b._id}
                  to={`/app/bookings/${b._id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 hover:bg-ink-50"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">{b.bookingNumber}</p>
                    <p className="text-xs text-ink-500">{b.customer?.name || b.source}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Recent trips"
            action={
              <Link to="/app/trips" className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {(stats?.recentTrips || []).length === 0 ? (
              <p className="text-sm text-ink-500">No trips yet.</p>
            ) : (
              stats.recentTrips.map((t) => (
                <Link
                  key={t._id}
                  to={`/app/trips/${t._id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 hover:bg-ink-50"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">{t.tripNumber}</p>
                    <p className="text-xs text-ink-500">
                      {t.vehicle?.registrationNumber || '—'} · {t.driver?.name || 'Unassigned'}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 pb-2 last:border-0 last:pb-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  )
}
