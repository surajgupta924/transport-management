import { Link } from 'react-router-dom'
import { Plus, Radio } from 'lucide-react'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { useGetInvoicesQuery } from '../invoices/invoicesApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/common/PageHeader'
import { Skeleton } from '../../components/common/EmptyState'
import { formatMoney } from '../../lib/utils'

export function PortalDashboardPage() {
  const { data: bookingData, isLoading: loadingBookings } = useGetBookingsQuery({ limit: 8, mine: true })
  const { data: invoiceData, isLoading: loadingInvoices } = useGetInvoicesQuery({ limit: 5, mine: true })
  const bookings = bookingData?.data || []
  const invoices = invoiceData?.data || []
  const openInvoice = invoices.find((item) => ['ISSUED', 'PARTIAL', 'OVERDUE'].includes(item.status))

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Your shipments"
        description="Book a new consignment, track live GPS, and pay issued invoices from this portal."
        action={
          <div className="flex gap-2">
            <Link to="/portal/track"><Button variant="secondary"><Radio className="h-4 w-4" /> Tracking</Button></Link>
            <Link to="/portal/create"><Button><Plus className="h-4 w-4" /> Create Shipment</Button></Link>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Latest bookings</p>
            {loadingBookings ? (
              <Skeleton className="h-24 w-full" />
            ) : bookings.length === 0 ? (
              <p className="text-sm text-ink-500">No bookings yet. Create your first shipment.</p>
            ) : (
              bookings.map((booking) => (
                <Link key={booking._id} to="/portal/track" className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 px-3 py-2 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-blue-700">{booking.shipmentNumber || booking.bookingNumber}</p>
                    <p className="text-xs text-ink-500">
                      {(booking.pickup?.city || booking.consignor?.city || 'Pickup') + ' → ' + (booking.delivery?.city || booking.consignee?.city || 'Drop')}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
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
                <p className="text-sm text-ink-600">{formatMoney(openInvoice.amountDue ?? openInvoice.totalAmount ?? openInvoice.total)}</p>
                <Link to="/portal/track"><Button variant="secondary" className="w-full">Pay from tracking</Button></Link>
              </div>
            ) : (
              <p className="text-sm text-ink-500">No outstanding invoices.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
