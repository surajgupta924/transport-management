import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { useGetTripQuery, useGetTripTrackQuery, useGetTripsQuery } from '../trips/tripsApi'
import { getSocket } from '../../lib/socket'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { MapPinned, Radio, RefreshCw } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const ACTIVE = ['ASSIGNED', 'STARTED', 'IN_PROGRESS', 'IN_TRANSIT']
const CLOSED = ['COMPLETED', 'CANCELLED']
const GPS_FRESH_MS = 45_000

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds.pad(0.2))
  }, [map, points])
  return null
}

function gpsState(trip, live) {
  const lastAt = live?.ts || trip?.lastLocation?.updatedAt
  if (!lastAt) return { on: false, stale: true, lastAt: null }
  const age = Date.now() - new Date(lastAt).getTime()
  const on = Boolean(trip?.locationSharing) && age < GPS_FRESH_MS
  return { on, stale: age >= GPS_FRESH_MS, lastAt, age }
}

export function TrackingPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isPortal = location.pathname.startsWith('/portal')
  const trackBase = isPortal ? '/portal/track' : '/app/tracking'
  const { data: tripsData, isLoading: loadingList, refetch } = useGetTripsQuery(
    { limit: 50 },
    { skip: Boolean(tripId), pollingInterval: tripId ? 0 : 10000 }
  )

  if (!tripId) {
    const trips = tripsData?.data || []
    const active = trips.filter((t) => ACTIVE.includes(t.status))
    const assigned = trips.filter((t) => t.status === 'ASSIGNED')
    const inTransit = trips.filter((t) => ['IN_TRANSIT', 'IN_PROGRESS', 'STARTED'].includes(t.status))
    const list = active.length ? active : trips
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <PageHeader
          title="Live Tracking"
          description="Driver GPS updates every 30 seconds. Viewer refreshes every 10 seconds."
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Active assignments" value={active.length} />
          <Stat label="Assigned" value={assigned.length} />
          <Stat label="In transit" value={inTransit.length} />
          <Stat label="Out for delivery" value={trips.filter((t) => t.status === 'STARTED').length} />
        </div>
        {loadingList ? (
          <Skeleton className="h-40 w-full" />
        ) : list.length === 0 ? (
          <EmptyState icon={MapPinned} title="No trips to track" description="Assign a vehicle and start a trip first." />
        ) : (
          <div className="space-y-2">
            {list.map((t) => {
              const gps = gpsState(t)
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => navigate(`${trackBase}/${t._id}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3 text-left hover:bg-ink-50"
                >
                  <div>
                    <p className="font-medium text-ink-900">{t.tripNumber}</p>
                    <p className="text-sm text-ink-500">
                      {(t.booking?.pickup?.city || 'Pickup') + ' → ' + (t.booking?.delivery?.city || 'Drop')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gps.on ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-600'}`}>
                      {gps.on ? 'Live GPS ON' : 'Live GPS OFF'}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return <TripMap tripId={tripId} isPortal={isPortal} />
}

function TripMap({ tripId, isPortal }) {
  const { data: tripData, isLoading, refetch, isFetching } = useGetTripQuery(tripId, {
    skip: !tripId,
    pollingInterval: 10000,
  })
  const { data: trackData, refetch: refetchTrack } = useGetTripTrackQuery(tripId, { skip: !tripId, pollingInterval: 10000 })
  const trip = tripData?.data
  const [live, setLive] = useState(null)
  const closed = CLOSED.includes(trip?.status)

  useEffect(() => {
    if (!tripId || closed) return undefined
    const socket = getSocket()
    socket.connect()
    socket.emit('trip:join', tripId)
    const onLocation = (payload) => {
      if (payload?.tripId === tripId || payload?.trip === tripId) {
        setLive({
          lat: payload.lat ?? payload.latitude,
          lng: payload.lng ?? payload.longitude,
          ts: payload.ts || payload.timestamp || Date.now(),
        })
      }
    }
    socket.on('trip:location', onLocation)
    return () => {
      socket.off('trip:location', onLocation)
      socket.emit('trip:leave', tripId)
    }
  }, [tripId, closed])

  const pickup = useMemo(() => {
    const p = trip?.booking?.pickup || trip?.pickup
    const lat = p?.lat ?? p?.address?.lat
    const lng = p?.lng ?? p?.address?.lng
    if (lat != null && lng != null) return [lat, lng]
    return null
  }, [trip])

  const destination = useMemo(() => {
    const d = trip?.booking?.delivery || trip?.delivery
    const lat = d?.lat ?? d?.address?.lat
    const lng = d?.lng ?? d?.address?.lng
    if (lat != null && lng != null) return [lat, lng]
    return null
  }, [trip])

  const history = useMemo(() => {
    const points = trackData?.data?.locations || trackData?.data || []
    return (Array.isArray(points) ? points : [])
      .map((p) => [p.lat ?? p.latitude, p.lng ?? p.longitude])
      .filter(([lat, lng]) => lat != null && lng != null)
  }, [trackData])

  const lastKnown = live
    ? [live.lat, live.lng]
    : trip?.lastLocation?.lat != null
      ? [trip.lastLocation.lat, trip.lastLocation.lng]
      : history.length
        ? history[history.length - 1]
        : pickup
  const gps = gpsState(trip, live)
  const current = lastKnown
  const fitPoints = [pickup, destination, current, ...history].filter(Boolean)
  const center = current || pickup || destination || [20.5937, 78.9629]

  if (isLoading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Live tracking"
        description={
          closed
            ? 'Tracking stopped after delivery for privacy.'
            : `Driver GPS updates every 30 seconds. Last sync ${gps.lastAt ? new Date(gps.lastAt).toLocaleTimeString() : '—'}`
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              loading={isFetching}
              onClick={() => {
                refetch()
                refetchTrack()
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {!isPortal && (
              <Link to={`/app/trips/${tripId}`}>
                <Button variant="secondary">Trip details</Button>
              </Link>
            )}
            {trip && <StatusBadge status={trip.status} />}
          </div>
        }
      />
      <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${gps.on ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}>
        <span className="flex items-center gap-2 font-medium">
          <Radio className="h-4 w-4" />
          {closed ? 'Tracking closed' : gps.on ? 'Live GPS ON' : 'Live GPS OFF'}
        </span>
        <span className="text-xs">
          {closed
            ? 'Live location is hidden after delivery or cancellation.'
            : gps.on
              ? 'Receiving driver mobile coordinates.'
              : 'Start mobile GPS on the driver app to share live coordinates.'}
        </span>
      </div>
      <Card>
        <CardBody className="p-0">
          {closed ? (
            <div className="flex h-[22rem] flex-col items-center justify-center gap-2 text-center">
              <MapPinned className="h-10 w-10 text-ink-300" />
              <p className="font-medium text-ink-800">Shipment tracking closed</p>
              <p className="max-w-sm text-sm text-ink-500">After delivery or cancellation, live location is hidden to protect privacy.</p>
            </div>
          ) : (
            <div className="h-[28rem] w-full overflow-hidden rounded-xl md:h-[32rem]">
              <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {fitPoints.length > 0 && <FitBounds points={fitPoints} />}
                {pickup && (
                  <Marker position={pickup}>
                    <Popup>Pickup</Popup>
                  </Marker>
                )}
                {destination && (
                  <Marker position={destination}>
                    <Popup>Destination</Popup>
                  </Marker>
                )}
                {current && (
                  <Marker position={current}>
                    <Popup>{gps.on ? 'Live GPS' : 'Last known location'}</Popup>
                  </Marker>
                )}
                {history.length > 1 && <Polyline positions={history} pathOptions={{ color: '#d97706', weight: 4 }} />}
              </MapContainer>
            </div>
          )}
        </CardBody>
      </Card>
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <Info label="Pickup" value={formatPlace(trip?.booking?.pickup)} />
        <Info label="Delivery" value={formatPlace(trip?.booking?.delivery)} />
        <Info
          label={gps.on ? 'Live update' : 'Last known'}
          value={
            gps.lastAt
              ? `${new Date(gps.lastAt).toLocaleString()}${current ? ` · ${current[0].toFixed(6)}, ${current[1].toFixed(6)}` : ''}`
              : 'Waiting for GPS'
          }
        />
      </div>
    </div>
  )
}

function formatPlace(loc) {
  if (!loc) return '—'
  return [loc.address, loc.city, loc.state].filter(Boolean).join(', ') || '—'
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 font-medium text-ink-900">{value}</p>
    </div>
  )
}

export function TrackingIndexPage() {
  return <TrackingPage />
}
