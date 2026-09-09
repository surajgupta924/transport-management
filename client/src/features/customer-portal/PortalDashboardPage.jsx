import { Link } from 'react-router-dom'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { useGetInvoicesQuery } from '../invoices/invoicesApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/common/EmptyState'
import { formatMoney } from '../../lib/utils'

export function PortalDashboardPage() {
  const { data: bookingData, isLoading: loadingBookings } = useGetBookingsQuery({ limit: 5, mine: true })
  const { data: invoiceData, isLoading: loadingInvoices } = useGetInvoicesQuery({ limit: 5, mine: true })
  const bookings = bookingData?.data || []
  const invoices = invoiceData?.data || []
  const openInvoice = invoices.find((i) => ['ISSUED', 'PARTIAL', 'OVERDUE'].includes(i.status))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Your shipments</h1>
        <p className="text-sm text-ink-500">Book, track, and manage invoices from one place.</p>
      </div>

      <Link to="/portal/bookings/new">
        <Button className="w-full">New booking</Button>
      </Link>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Latest bookings</p>
          {loadingBookings ? (
            <Skeleton className="h-20 w-full" />
          ) : bookings.length === 0 ? (
            <p className="text-sm text-ink-500">No bookings yet. Create your first shipment.</p>
          ) : (
            bookings.slice(0, 3).map((b) => (
              <Link key={b._id} to={`/portal/bookings/${b._id}`} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-900">{b.bookingNumber}</p>
                  <p className="text-xs text-ink-500">
                    {(b.pickup?.city || 'Pickup') + ' → ' + (b.delivery?.city || 'Drop')}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loadingInvoices ? (
            <Skeleton className="h-16 w-full" />
          ) : openInvoice ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Outstanding invoice</p>
              <p className="font-display text-lg font-semibold">{openInvoice.invoiceNumber}</p>
              <p className="text-sm text-ink-600">
                {formatMoney(openInvoice.amountDue ?? openInvoice.totalAmount ?? openInvoice.total)}
              </p>
              <Link to="/portal/invoices">
                <Button variant="secondary" className="w-full">
                  View invoices
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-ink-500">No outstanding invoices.</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
