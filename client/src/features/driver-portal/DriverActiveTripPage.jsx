import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useGetTripQuery,
  useGetTripsQuery,
  usePostTripLocationMutation,
  useSetTripSharingMutation,
  useUpdateTripStatusMutation,
} from '../trips/tripsApi'
import { getSocket } from '../../lib/socket'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const actions = {
  ASSIGNED: [{ status: 'STARTED', label: 'Start trip' }],
  STARTED: [{ status: 'IN_TRANSIT', label: 'Mark in transit' }],
  IN_TRANSIT: [{ status: 'COMPLETED', label: 'Complete trip' }],
  IN_PROGRESS: [{ status: 'COMPLETED', label: 'Complete trip' }],
}

export function DriverActiveTripPage() {
  const { data, isLoading } = useGetTripsQuery({
    limit: 20,
    mine: true,
  })
  const trip = (data?.data || []).find((t) =>
    ['ASSIGNED', 'STARTED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(t.status)
  )

  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (!trip) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-xl font-semibold">Active trip</h1>
        <p className="text-sm text-ink-500">No trip in progress.</p>
        <Link to="/driver/trips">
          <Button variant="secondary" className="w-full">
            Browse trips
          </Button>
        </Link>
      </div>
    )
  }

  return <TripActions tripId={trip._id} />
}

export function DriverTripDetailPage() {
  const { id } = useParams()
  return <TripActions tripId={id} />
}

function TripActions({ tripId }) {
  const toast = useToast()
  const { data, isLoading } = useGetTripQuery(tripId, { pollingInterval: 15000 })
  const [updateStatus, { isLoading: updating }] = useUpdateTripStatusMutation()
  const [postLocation] = usePostTripLocationMutation()
  const [setSharing] = useSetTripSharingMutation()
  const trip = data?.data
  const [sharing, setSharingState] = useState(false)
  const watchId = useRef(null)
  const lastHttp = useRef(0)

  useEffect(() => {
    setSharingState(Boolean(trip?.locationSharing))
  }, [trip?.locationSharing])

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
      socket.emit('trip:sharing', { tripId, sharing: false })
      await setSharing({ id: tripId, sharing: false }).unwrap()
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
    socket.emit('trip:join', tripId)
    socket.emit('trip:sharing', { tripId, sharing: true })
    setSharing({ id: tripId, sharing: true }).catch(() => {})
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          tripId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          ts: Date.now(),
          source: 'DRIVER_MOBILE',
        }
        socket.emit('trip:location', point)
        if (Date.now() - lastHttp.current > 25000) {
          lastHttp.current = Date.now()
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
        }
      },
      (err) => toast.error(err.message || 'Location error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setSharingState(true)
    toast.success('Live GPS ON — sharing phone coordinates')
  }

  const toggleSharing = () => {
    if (sharing) {
      stopSharing()
      toast.success('Live GPS OFF')
      return
    }
    startSharing()
  }

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!trip) return <p className="text-sm text-ink-500">Trip not found.</p>

  const last = trip.lastLocation

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-900">{trip.tripNumber || 'Trip'}</h1>
          <p className="text-sm text-ink-500">
            {(trip.booking?.pickup?.city || 'Pickup') + ' → ' + (trip.booking?.delivery?.city || 'Drop')}
          </p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${sharing ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <p className="font-medium">{sharing ? 'Live GPS ON' : 'Live GPS OFF'}</p>
        <p className="mt-1 text-xs">
          {sharing
            ? 'Phone or browser coordinates are saved every few seconds.'
            : 'Start mobile GPS to save the phone or browser’s actual coordinates as vehicle fallback.'}
        </p>
        {last?.lat != null && (
          <p className="mt-1 text-xs">
            Last known: {Number(last.lat).toFixed(6)}, {Number(last.lng).toFixed(6)}
            {last.updatedAt ? ` · ${new Date(last.updatedAt).toLocaleString()}` : ''}
          </p>
        )}
      </div>

      <Card>
        <CardHeader title="Trip actions" />
        <CardBody className="space-y-3">
          {(actions[trip.status] || []).map((a) => (
            <Button
              key={a.status}
              className="w-full"
              loading={updating}
              onClick={async () => {
                try {
                  if (a.status === 'COMPLETED') await stopSharing()
                  await updateStatus({ id: tripId, status: a.status }).unwrap()
                  if (['STARTED', 'IN_TRANSIT'].includes(a.status) && !sharing) startSharing()
                  toast.success(a.label)
                } catch (err) {
                  toast.error(getErrorMessage(err))
                }
              }}
            >
              {a.label}
            </Button>
          ))}
          <Button className="w-full" variant={sharing ? 'danger' : 'secondary'} onClick={toggleSharing}>
            {sharing ? 'Stop Live GPS' : 'Start Mobile GPS'}
          </Button>
          <Link to={`/driver/pod?tripId=${tripId}`} className="block">
            <Button className="w-full" variant="secondary">
              Submit POD
            </Button>
          </Link>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Addresses" />
        <CardBody className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase text-ink-400">Pickup</p>
            <p className="text-ink-800">{trip.booking?.pickup?.address || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-ink-400">Delivery</p>
            <p className="text-ink-800">{trip.booking?.delivery?.address || '—'}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
