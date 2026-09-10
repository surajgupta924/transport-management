import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Truck,
} from 'lucide-react'
import {
  useGetTripQuery,
  useGetTripsQuery,
  usePostTripLocationMutation,
  useSetTripSharingMutation,
  useUpdateTripStatusMutation,
} from '../trips/tripsApi'
import { getSocket } from '../../lib/socket'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, Skeleton, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const LIVE_STATUSES = ['ASSIGNED', 'STARTED', 'IN_PROGRESS', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
const actions = {
  ASSIGNED: [{ status: 'STARTED', label: 'Start trip' }],
  ACCEPTED: [{ status: 'STARTED', label: 'Start trip' }],
  STARTED: [{ status: 'IN_TRANSIT', label: 'Mark in transit' }],
  IN_TRANSIT: [
    { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
    { status: 'COMPLETED', label: 'Complete trip' },
  ],
  IN_PROGRESS: [
    { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
    { status: 'COMPLETED', label: 'Complete trip' },
  ],
  OUT_FOR_DELIVERY: [{ status: 'COMPLETED', label: 'Complete trip' }],
}

function shipmentOf(trip) {
  return trip?.booking?.shipmentNumber || trip?.booking?.bookingNumber || trip?.tripNumber || '—'
}

function isLiveTrip(trip) {
  if (['COMPLETED', 'CANCELLED'].includes(trip.status)) return false
  if (trip.assignmentStatus === 'RELEASED' || trip.assignmentStatus === 'REJECTED') return false
  return trip.assignmentStatus === 'ACCEPTED' || LIVE_STATUSES.includes(trip.status)
}

function useDriverGps(tripIds) {
  const toast = useToast()
  const [sharing, setSharingState] = useState(false)
  const [lastPoint, setLastPoint] = useState(null)
  const [postLocation] = usePostTripLocationMutation()
  const [setSharing] = useSetTripSharingMutation()
  const watchId = useRef(null)
  const lastHttp = useRef(0)
  const idsRef = useRef(tripIds)
  idsRef.current = tripIds

  useEffect(() => {
    return () => {
      if (watchId.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  const stopSharing = async () => {
    if (watchId.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setSharingState(false)
    try {
      const socket = getSocket()
      idsRef.current.forEach((tripId) => {
        socket.emit('trip:sharing', { tripId, sharing: false })
        setSharing({ id: tripId, sharing: false }).catch(() => {})
      })
    } catch {
      // local stop still applies
    }
  }

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device')
      return
    }
    const socket = getSocket()
    socket.connect()
    idsRef.current.forEach((tripId) => {
      socket.emit('trip:join', tripId)
      socket.emit('trip:sharing', { tripId, sharing: true })
      setSharing({ id: tripId, sharing: true }).catch(() => {})
    })
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          ts: Date.now(),
          source: 'DRIVER_MOBILE',
        }
        setLastPoint(point)
        idsRef.current.forEach((tripId) => {
          socket.emit('trip:location', { ...point, tripId })
        })
        if (Date.now() - lastHttp.current > 30000) {
          lastHttp.current = Date.now()
          idsRef.current.forEach((tripId) => {
            postLocation({
              id: tripId,
              lat: point.lat,
              lng: point.lng,
              accuracy: point.accuracy,
              speed: point.speed,
              heading: point.heading,
              timestamp: point.ts,
              source: 'DRIVER_MOBILE',
            }).catch(() => {})
          })
        }
      },
      (err) => toast.error(err.message || 'Location error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setSharingState(true)
    toast.success('Live GPS ON — sharing phone coordinates every 30 seconds')
  }

  return { sharing, lastPoint, startSharing, stopSharing }
}

export function DriverActiveTripPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading, isFetching, refetch } = useGetTripsQuery(
    { limit: 100, mine: true },
    { pollingInterval: 10000 }
  )
  const trips = data?.data || []
  const live = trips.filter(isLiveTrip)
  const assigned = live.filter((t) => t.status === 'ASSIGNED' || t.assignmentStatus === 'ACCEPTED')
  const inTransit = live.filter((t) => ['IN_TRANSIT', 'IN_PROGRESS', 'STARTED'].includes(t.status))
  const ofd = live.filter((t) => t.status === 'OUT_FOR_DELIVERY')
  const gps = useDriverGps(live.map((t) => t._id))
  const synced = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return live.filter((trip) => {
      if (status === 'ASSIGNED' && !(trip.status === 'ASSIGNED' || trip.assignmentStatus === 'ACCEPTED')) return false
      if (status === 'IN_TRANSIT' && !['IN_TRANSIT', 'IN_PROGRESS', 'STARTED'].includes(trip.status)) return false
      if (status === 'OUT_FOR_DELIVERY' && trip.status !== 'OUT_FOR_DELIVERY') return false
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
  }, [live, search, status])

  const toggleGps = () => {
    if (gps.sharing) {
      gps.stopSharing()
      toast.success('Live GPS OFF')
      return
    }
    gps.startSharing()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="STEP 4 · TRIP EXECUTION"
        title="Live Tracking"
        description={`Driver GPS updates every 30 seconds · Viewer refreshes every 10 seconds · Synced at ${synced}`}
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Vehicle GPS is the primary location source. If the device is unavailable, the driver can select{' '}
        <strong>Start Mobile Fallback</strong> and allow browser location access. Mobile coordinates will update every 30 seconds.
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-4 ${
          gps.sharing ? 'border-emerald-200 bg-emerald-50' : 'border-ink-100 bg-white'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 rounded-full p-2 ${gps.sharing ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-ink-900">{gps.sharing ? 'Live GPS ON' : 'Live GPS OFF'}</p>
            <p className="text-sm text-ink-500">
              {gps.sharing
                ? 'Phone or browser latitude and longitude are being saved against your active trips.'
                : "When started, the phone or browser's actual latitude and longitude will be saved."}
            </p>
            {gps.lastPoint ? (
              <p className="mt-1 text-xs text-ink-400">
                Last known: {gps.lastPoint.lat.toFixed(6)}, {gps.lastPoint.lng.toFixed(6)}
              </p>
            ) : null}
          </div>
        </div>
        <Button variant={gps.sharing ? 'danger' : 'secondary'} onClick={toggleGps}>
          {gps.sharing ? 'Stop Live GPS' : 'Start Mobile Fallback'}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Active assignments" value={live.length} icon={Activity} />
        <StatCard label="Assigned" value={assigned.length} tone="blue" icon={Truck} />
        <StatCard label="In transit" value={inTransit.length} icon={MapPin} />
        <StatCard label="Out for delivery" value={ofd.length} tone="green" icon={Navigation} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Search shipment, vehicle or driver..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
          <option value="">All active</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_TRANSIT">In transit</option>
          <option value="OUT_FOR_DELIVERY">Out for delivery</option>
        </Select>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : rows.length === 0 ? (
            <div className="px-6 py-16">
              <EmptyState
                icon={MapPin}
                title="No active shipments found"
                description="When shipments are assigned and active, their live location and delivery status will be displayed here."
              />
            </div>
          ) : (
            <table className={`min-w-full text-sm ${isFetching ? 'opacity-60' : ''}`}>
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Shipment / Trip</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Trip contacts</th>
                  <th className="px-4 py-3 text-left">Latest location</th>
                  <th className="px-4 py-3 text-left">Coordinates</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((trip) => {
                  const last = gps.lastPoint && gps.sharing ? gps.lastPoint : trip.lastLocation
                  return (
                    <tr key={trip._id} className="border-t border-ink-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-blue-700">{shipmentOf(trip)}</p>
                        <p className="text-xs text-ink-400">{trip.tripNumber}</p>
                      </td>
                      <td className="px-4 py-3">{trip.vehicle?.registrationNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <p>{trip.driver?.name || '—'}</p>
                        <p className="text-xs text-ink-400">{trip.driver?.mobile || trip.booking?.consignee?.phone || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500">
                        {trip.booking?.delivery?.city || trip.booking?.pickup?.city || 'Awaiting GPS'}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500">
                        {last?.lat != null ? `${Number(last.lat).toFixed(5)}, ${Number(last.lng).toFixed(5)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trip.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/driver/trips/${trip._id}`} className="text-sm font-medium text-blue-700">
                          Open trip
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export function DriverTripDetailPage() {
  const { id } = useParams()
  return <TripActions tripId={id} />
}

function TripActions({ tripId }) {
  const toast = useToast()
  const { data, isLoading } = useGetTripQuery(tripId, { pollingInterval: 10000 })
  const [updateStatus, { isLoading: updating }] = useUpdateTripStatusMutation()
  const trip = data?.data
  const gps = useDriverGps(tripId ? [tripId] : [])

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!trip) return <p className="text-sm text-ink-500">Trip not found.</p>

  const last = gps.lastPoint || trip.lastLocation
  const tripActions = actions[trip.status] || (trip.assignmentStatus === 'ACCEPTED' ? actions.ACCEPTED : [])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        eyebrow="Live trip"
        title={shipmentOf(trip)}
        description={`${trip.booking?.pickup?.city || 'Pickup'} → ${trip.booking?.delivery?.city || 'Drop'}`}
        action={<StatusBadge status={trip.status} />}
      />

      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          gps.sharing ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        <p className="font-medium">{gps.sharing ? 'Live GPS ON' : 'Live GPS OFF'}</p>
        <p className="mt-1 text-xs">
          {gps.sharing
            ? 'Phone or browser coordinates are saved every 30 seconds.'
            : 'Start mobile GPS to save the phone or browser’s actual coordinates as vehicle fallback.'}
        </p>
        {last?.lat != null && (
          <p className="mt-1 text-xs">
            Last known: {Number(last.lat).toFixed(6)}, {Number(last.lng).toFixed(6)}
          </p>
        )}
      </div>

      <Card>
        <CardBody className="space-y-3">
          {tripActions.map((a) => (
            <Button
              key={a.status}
              className="w-full"
              loading={updating}
              onClick={async () => {
                try {
                  if (a.status === 'COMPLETED') await gps.stopSharing()
                  await updateStatus({ id: tripId, status: a.status }).unwrap()
                  if (['STARTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(a.status) && !gps.sharing) gps.startSharing()
                  toast.success(a.label)
                } catch (err) {
                  toast.error(getErrorMessage(err))
                }
              }}
            >
              {a.label}
            </Button>
          ))}
          <Button className="w-full" variant={gps.sharing ? 'danger' : 'secondary'} onClick={() => (gps.sharing ? (gps.stopSharing(), toast.success('Live GPS OFF')) : gps.startSharing())}>
            {gps.sharing ? 'Stop Live GPS' : 'Start Mobile Fallback'}
          </Button>
          <Link to={`/driver/pod?tripId=${tripId}`} className="block">
            <Button className="w-full" variant="secondary">
              Submit POD
            </Button>
          </Link>
          <Link to="/driver/active" className="block">
            <Button className="w-full" variant="ghost">
              Back to live deliveries
            </Button>
          </Link>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase text-ink-400">Pickup</p>
            <p className="text-ink-800">{trip.booking?.pickup?.address || trip.booking?.pickup?.city || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-ink-400">Delivery</p>
            <p className="text-ink-800">{trip.booking?.delivery?.address || trip.booking?.delivery?.city || '—'}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
