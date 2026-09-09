import { Link, useLocation, useParams } from 'react-router-dom'
import { useGetBookingQuery, useUpdateBookingStatusMutation } from './bookingsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const nextStatuses = {
  DRAFT: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
}

export function BookingDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const isPortal = location.pathname.startsWith('/portal')
  const toast = useToast()
  const { data, isLoading } = useGetBookingQuery(id)
  const [updateStatus, { isLoading: updating }] = useUpdateBookingStatusMutation()
  const booking = data?.data

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!booking) return <p className="text-sm text-ink-500">Booking not found.</p>

  const setStatus = async (status) => {
    try {
      await updateStatus({ id, status }).unwrap()
      toast.success(`Status → ${status}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={booking.bookingNumber || `Booking ${id.slice(-6)}`}
        description={booking.customer?.name || 'Customer booking'}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to={isPortal ? '/portal/bookings' : '/app/bookings'}>
              <Button variant="secondary">Back</Button>
            </Link>
            {!isPortal && (
              <Can permission="bookings:edit">
                <Link to={`/app/bookings/${id}/edit`}>
                  <Button>Edit</Button>
                </Link>
              </Can>
            )}
            {booking.trip && (
              <Link to={`/app/trips/${booking.trip._id || booking.trip}`}>
                <Button variant="secondary">Open trip</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={booking.status} />
        <StatusBadge status={booking.source} />
        <Can permission="bookings:edit">
          {!isPortal && (nextStatuses[booking.status] || []).map((s) => (
            <Button key={s} size="sm" variant="secondary" loading={updating} onClick={() => setStatus(s)}>
              Mark {s.replace(/_/g, ' ').toLowerCase()}
            </Button>
          ))}
        </Can>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Pickup" />
          <CardBody className="space-y-1 text-sm text-ink-700">
            <p>{booking.pickup?.address || booking.pickupAddress}</p>
            <p>
              {[booking.pickup?.city || booking.pickupCity, booking.pickup?.state, booking.pickup?.pincode].filter(Boolean).join(', ')}
            </p>
            {booking.pickup?.landmark && <p className="text-ink-500">Landmark: {booking.pickup.landmark}</p>}
            <p className="text-ink-500">
              {booking.pickup?.contactName || booking.pickup?.contact} {booking.pickup?.contactPhone || ''}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Delivery" />
          <CardBody className="space-y-1 text-sm text-ink-700">
            <p>{booking.delivery?.address || booking.deliveryAddress}</p>
            <p>
              {[booking.delivery?.city || booking.destinationCity, booking.delivery?.state, booking.delivery?.pincode].filter(Boolean).join(', ')}
            </p>
            {booking.delivery?.landmark && <p className="text-ink-500">Landmark: {booking.delivery.landmark}</p>}
            <p className="text-ink-500">
              {booking.delivery?.contactName || booking.delivery?.contact} {booking.delivery?.contactPhone || ''}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Cargo" />
          <CardBody className="space-y-2 text-sm">
            <p>{booking.cargo?.description || booking.cargoDescription || '—'}</p>
            <p className="text-ink-500">
              {booking.cargo?.material ? `${booking.cargo.material} · ` : ''}
              Weight {booking.cargo?.weightKg ?? '—'} kg · Qty {booking.cargo?.quantity || booking.cargo?.packages || '—'}
              {booking.vehicleTypeRequired ? ` · ${booking.vehicleTypeRequired}` : ''}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Charges" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Freight" value={booking.charges?.freight ?? booking.freightCharge} />
            <Row label="Other" value={booking.charges?.other} />
            <Row label="Total" value={booking.charges?.total ?? booking.totalAmount} />
            <Row label="Payment" value={booking.paymentMode} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-ink-100 pb-2 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value ?? '—'}</span>
    </div>
  )
}
