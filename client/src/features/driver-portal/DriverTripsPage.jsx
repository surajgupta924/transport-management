import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Truck } from 'lucide-react'
import { useAcceptAssignmentMutation, useGetTripsQuery, useRejectAssignmentMutation } from '../trips/tripsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

function shipmentOf(trip) {
  return trip?.booking?.shipmentNumber || trip?.booking?.bookingNumber || trip?.tripNumber || '—'
}

function isAwaiting(trip) {
  return ['ASSIGNED', 'PENDING_APPROVAL'].includes(trip.assignmentStatus)
}

export function DriverTripsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading, isFetching, refetch } = useGetTripsQuery({ limit: 100, mine: true })
  const [accept, { isLoading: accepting }] = useAcceptAssignmentMutation()
  const [reject, { isLoading: rejecting }] = useRejectAssignmentMutation()
  const trips = data?.data || []

  const awaiting = trips.filter(isAwaiting)
  const accepted = trips.filter((t) => t.assignmentStatus === 'ACCEPTED')
  const history = trips.filter((t) => !isAwaiting(t) && t.assignmentStatus !== 'ACCEPTED')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trips.filter((trip) => {
      if (status === 'awaiting' && !isAwaiting(trip)) return false
      if (status === 'accepted' && trip.assignmentStatus !== 'ACCEPTED') return false
      if (status === 'history' && (isAwaiting(trip) || trip.assignmentStatus === 'ACCEPTED')) return false
      if (status && !['awaiting', 'accepted', 'history'].includes(status) && trip.assignmentStatus !== status) return false
      if (!q) return true
      const hay = [
        shipmentOf(trip),
        trip.tripNumber,
        trip.vehicle?.registrationNumber,
        trip.driver?.name,
        trip.booking?.pickup?.city,
        trip.booking?.delivery?.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [trips, search, status])

  const onAccept = async (id) => {
    try {
      await accept(id).unwrap()
      toast.success('Assignment accepted — ready for trip')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onReject = async (id) => {
    const reason = window.prompt('Reason for rejecting this assignment?', 'Unable to take this trip')
    if (reason == null) return
    try {
      await reject({ id, reason: reason || 'Rejected by driver' }).unwrap()
      toast.success('Assignment rejected')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="STEP 3 · ASSIGNMENT"
        title="My Assignments"
        description="Accept or reject the new assignment. Once accepted, the trip will start in Live Tracking."
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Awaiting decision" value={awaiting.length} tone="blue" icon={Truck} />
        <StatCard label="Accepted" value={accepted.length} tone="green" />
        <StatCard label="Assignment history" value={history.length} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search shipment, vehicle or driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-64">
          <option value="">All assignment statuses</option>
          <option value="awaiting">Awaiting decision</option>
          <option value="accepted">Accepted</option>
          <option value="history">Assignment history</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted only</option>
          <option value="RELEASED">Released</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : rows.length === 0 ? (
            <EmptyState icon={Truck} title="No assignments found" description="New vehicle and driver assignments will appear here." />
          ) : (
            <table className={`min-w-full text-sm ${isFetching ? 'opacity-60' : ''}`}>
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Shipment</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Driver</th>
                  <th className="px-4 py-3 text-left">Assigned at</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((trip) => (
                  <tr key={trip._id} className="border-t border-ink-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-blue-700">{shipmentOf(trip)}</p>
                      <p className="text-xs text-ink-400">
                        {(trip.booking?.pickup?.city || '—').toLowerCase()} → {(trip.booking?.delivery?.city || '—').toLowerCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{trip.vehicle?.registrationNumber || '—'}</p>
                      <p className="text-xs text-ink-400">{trip.vehicle?.type || 'truck'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{trip.driver?.name || '—'}</p>
                      <p className="text-xs text-ink-400">{trip.driver?.mobile}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {trip.assignedAt || trip.updatedAt
                        ? new Date(trip.assignedAt || trip.updatedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-ink-500">
                        Assignment: <StatusBadge status={trip.assignmentStatus || trip.status} />
                      </p>
                      <p className="mt-1 text-xs text-ink-400">Shipment: {String(trip.booking?.status || '—').replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isAwaiting(trip) ? (
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="success" loading={accepting} onClick={() => onAccept(trip._id)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="danger" loading={rejecting} onClick={() => onReject(trip._id)}>
                            Reject
                          </Button>
                        </div>
                      ) : trip.assignmentStatus === 'ACCEPTED' && !['COMPLETED', 'CANCELLED'].includes(trip.status) ? (
                        <Link to="/driver/active" className="text-sm font-medium text-ink-400">
                          Ready for trip
                        </Link>
                      ) : (
                        <span className="text-sm text-ink-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
