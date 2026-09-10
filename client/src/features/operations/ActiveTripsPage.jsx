import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useGetTripsQuery } from '../trips/tripsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/OpsUi'

const ACTIVE = ['ASSIGNED', 'STARTED', 'IN_PROGRESS', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']

export function ActiveTripsPage() {
  const { data, refetch, isFetching } = useGetTripsQuery({ limit: 50 })
  const trips = (data?.data || []).filter((t) => ACTIVE.includes(t.status) || t.assignmentStatus === 'ACCEPTED')
  const booked = trips.filter((t) => t.status === 'ASSIGNED').length
  const inTransit = trips.filter((t) => ['IN_TRANSIT', 'IN_PROGRESS', 'STARTED'].includes(t.status)).length
  const ofd = trips.filter((t) => t.status === 'OUT_FOR_DELIVERY').length

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Active Trips"
        description="Monitor automated trip progress through GPS and geofencing."
        action={<Button variant="secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Routine status automation enabled. Out for Delivery is set at 90% progress along each shipment's planned route; exact pickup and delivery arrivals are detected by GPS geofences.
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="All active" value={trips.length} />
        <StatCard label="Booked" value={booked} tone="blue" />
        <StatCard label="In transit" value={inTransit} />
        <StatCard label="Out for delivery" value={ofd} />
      </div>
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className={`min-w-full text-sm ${isFetching ? 'opacity-60' : ''}`}>
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Trip / Shipment</th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Driver</th>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-left">GPS / Milestone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t._id} className="border-t border-ink-50">
                  <td className="px-4 py-3 font-medium text-blue-700">{t.tripNumber}<div className="text-xs text-ink-400">{t.booking?.shipmentNumber || t.booking?.bookingNumber}</div></td>
                  <td className="px-4 py-3">{t.vehicle?.registrationNumber || '—'}</td>
                  <td className="px-4 py-3">{t.driver?.name || '—'}</td>
                  <td className="px-4 py-3">{t.booking?.pickup?.city} → {t.booking?.delivery?.city}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {t.lastLocation ? `${t.lastLocation.lat?.toFixed?.(4)}, ${t.lastLocation.lng?.toFixed?.(4)}` : 'No GPS yet'}
                    <div>Source: {t.lastLocation?.source || '—'}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.assignmentStatus === 'ACCEPTED' ? 'ACCEPTED' : t.status} /></td>
                  <td className="px-4 py-3"><Link to={`/app/tracking/${t._id}`} className="text-sm font-medium text-blue-700">Track</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}
