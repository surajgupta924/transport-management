import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { MapPin, RefreshCw, Search } from 'lucide-react'
import { useGetBookingsQuery, useLazyGetBookingQuery } from '../bookings/bookingsApi'
import { useGetInvoicesQuery } from '../invoices/invoicesApi'
import { useCreatePaymentMutation } from '../payments/paymentsApi'
import { useGetTripQuery, useGetTripTrackQuery } from '../trips/tripsApi'
import { getSocket } from '../../lib/socket'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { ShipmentLrPrint } from '../shipments/ShipmentLrPrint'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    map.fitBounds(L.latLngBounds(points).pad(0.2))
  }, [map, points])
  return null
}

function coords(loc) {
  const lat = loc?.lat ?? loc?.address?.lat
  const lng = loc?.lng ?? loc?.address?.lng
  if (lat == null || lng == null) return null
  return [Number(lat), Number(lng)]
}

function place(loc, party) {
  return [
    party?.address || loc?.address,
    party?.city || loc?.city,
    party?.state || loc?.state,
    party?.pincode || loc?.pincode,
  ].filter(Boolean).join(', ') || '—'
}

export function PortalTrackPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [fitKey, setFitKey] = useState(0)
  const [syncedAt, setSyncedAt] = useState(() => new Date())
  const { data, refetch, isFetching } = useGetBookingsQuery({ limit: 50, mine: true, search: search || undefined }, { pollingInterval: 10000 })
  const { data: invoiceData } = useGetInvoicesQuery({ limit: 50, mine: true })
  const [loadBooking] = useLazyGetBookingQuery()
  const [createPayment, { isLoading: paying }] = useCreatePaymentMutation()
  const rows = data?.data || []
  const invoices = invoiceData?.data || []
  const selected = rows.find((row) => row._id === selectedId) || rows[0]
  const tripId = selected?.trip?._id || selected?.trip
  const { data: tripData } = useGetTripQuery(tripId, { skip: !tripId, pollingInterval: 10000 })
  const { data: trackData } = useGetTripTrackQuery(tripId, { skip: !tripId, pollingInterval: 10000 })
  const trip = tripData?.data
  const [live, setLive] = useState(null)

  useEffect(() => {
    if (rows.length && !selectedId) setSelectedId(rows[0]._id)
  }, [rows, selectedId])

  useEffect(() => {
    const timer = setInterval(() => setSyncedAt(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!tripId) return undefined
    const socket = getSocket()
    socket.connect()
    socket.emit('trip:join', tripId)
    const onLocation = (payload) => {
      if (payload?.tripId === tripId || payload?.trip === tripId) {
        setLive({ lat: payload.lat ?? payload.latitude, lng: payload.lng ?? payload.longitude, ts: payload.timestamp || Date.now() })
      }
    }
    socket.on('trip:location', onLocation)
    return () => {
      socket.off('trip:location', onLocation)
      socket.emit('trip:leave', tripId)
    }
  }, [tripId])

  const pickup = coords(selected?.pickup)
  const delivery = coords(selected?.delivery)
  const history = useMemo(() => {
    const points = trackData?.data?.locations || trackData?.data || []
    return (Array.isArray(points) ? points : [])
      .map((point) => [point.lat ?? point.latitude, point.lng ?? point.longitude])
      .filter(([lat, lng]) => lat != null && lng != null)
  }, [trackData])
  const current = live
    ? [live.lat, live.lng]
    : trip?.lastLocation?.lat != null
      ? [trip.lastLocation.lat, trip.lastLocation.lng]
      : history.at(-1)
  const hasGps = Boolean(current)
  const fitPoints = [pickup, delivery, current, ...history].filter(Boolean)
  const center = current || pickup || delivery || [20.5937, 78.9629]
  const relatedInvoice = invoices.find((inv) => String(inv.booking?._id || inv.booking) === String(selected?._id) && ['ISSUED', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (inv.amountDue || 0) > 0)

  const openLr = async () => {
    if (!selected) return
    try {
      const result = await loadBooking(selected._id).unwrap()
      setPrintRow(result.data || result)
    } catch {
      setPrintRow(selected)
    }
  }

  const pay = async () => {
    if (!relatedInvoice) return
    try {
      await createPayment({
        invoiceId: relatedInvoice._id,
        amount: relatedInvoice.amountDue || relatedInvoice.total,
        method: 'UPI',
        paidAt: new Date().toISOString().slice(0, 10),
      }).unwrap()
      toast.success('Payment recorded')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="CUSTOMER TRACKING"
        title="Shipment Tracking & Payment"
        description="View the live status of your shipments and make payments for issued invoices directly from here."
      />
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-ink-400" />
          <Input className="pl-9" placeholder="Search by AWB, shipment number, origin or destination" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => refetch()}>Search</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Where is my shipment?</p>
                <p className="text-xs text-ink-500">The read-only location refreshes automatically every 10 seconds. Synced {syncedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${hasGps ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {hasGps ? 'Live GPS' : 'Location pending'}
              </span>
            </div>
            <div className="h-[28rem] overflow-hidden rounded-2xl border border-ink-100 bg-slate-50">
              {hasGps || pickup || delivery ? (
                <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {fitPoints.length > 0 && <FitBounds key={fitKey} points={fitPoints} />}
                  {pickup && <Marker position={pickup}><Popup>Pickup</Popup></Marker>}
                  {delivery && <Marker position={delivery}><Popup>Delivery</Popup></Marker>}
                  {current && <Marker position={current}><Popup>Live location</Popup></Marker>}
                  {history.length > 1 && <Polyline positions={history} pathOptions={{ color: '#2563eb', weight: 4 }} />}
                </MapContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <MapPin className="h-6 w-6 text-ink-400" />
                  </div>
                  <p className="font-medium text-ink-800">Waiting for live GPS.</p>
                  <p className="mt-1 max-w-sm text-sm text-ink-500">Vehicle tracker data will be used first; if unavailable, the location will come from the driver&apos;s mobile GPS.</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Select value={selected?._id || ''} onChange={(e) => setSelectedId(e.target.value)}>
                  {rows.map((row) => (
                    <option key={row._id} value={row._id}>{row.shipmentNumber || row.bookingNumber || row.lrNumber}</option>
                  ))}
                </Select>
                <Button size="sm" variant="secondary" loading={isFetching} onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
              </div>
              {selected ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Selected shipment</p>
                  <p className="font-semibold text-blue-700">{selected.shipmentNumber || selected.bookingNumber}</p>
                  <StatusBadge status={selected.status} />
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-ink-400">Latest location</p>
                    <p className="text-sm">{hasGps ? `${current[0].toFixed(5)}, ${current[1].toFixed(5)}` : 'Location update pending'}</p>
                    <p className="text-xs text-ink-400">{syncedAt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-500">1 PICKUP</p>
                    <p className="text-sm">{place(selected.pickup, selected.consignor)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">2 DELIVERY</p>
                    <p className="text-sm">{place(selected.delivery, selected.consignee)}</p>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => setFitKey((n) => n + 1)}>Full Route</Button>
                </>
              ) : (
                <p className="text-sm text-ink-500">No shipments yet. Create a shipment to track it here.</p>
              )}
            </CardBody>
          </Card>
          {relatedInvoice && (
            <Card>
              <CardBody className="space-y-2">
                <p className="text-xs font-semibold uppercase text-ink-400">Payment due</p>
                <p className="font-medium">{relatedInvoice.invoiceNumber}</p>
                <p className="text-lg font-semibold">{formatMoney(relatedInvoice.amountDue)}</p>
                <Button loading={paying} className="w-full" onClick={pay}>Pay now</Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      {selected && (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-ink-400">AWB / Tracking number</p>
              <p className="font-semibold">{selected.shipmentNumber || selected.bookingNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={openLr}>View LR</Button>
              <StatusBadge status={selected.status} />
            </div>
          </CardBody>
        </Card>
      )}
      {printRow && <ShipmentLrPrint booking={printRow} onClose={() => setPrintRow(null)} />}
    </div>
  )
}
