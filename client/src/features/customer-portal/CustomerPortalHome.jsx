import { Link } from 'react-router-dom'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { useGetInvoicesQuery } from '../invoices/invoicesApi'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/common/StatusBadge'
import { formatMoney } from '../../lib/utils'

export function CustomerPortalHome() {
  const { data: bookingsData } = useGetBookingsQuery({ mine: true, limit: 5 })
  const { data: invoicesData } = useGetInvoicesQuery({ mine: true, limit: 5 })
  const bookings = bookingsData?.data || []
  const invoices = invoicesData?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Your shipments</h1>
          <p className="text-sm text-ink-500">Book, track, and pay from one place.</p>
        </div>
        <Link to="/portal/bookings/new">
          <Button>New booking</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Recent bookings" action={<Link to="/portal/bookings" className="text-sm text-brand-700">All</Link>} />
          <CardBody className="space-y-3 text-sm">
            {bookings.length === 0 ? (
              <p className="text-ink-500">No bookings yet.</p>
            ) : (
              bookings.map((b) => (
                <Link key={b._id} to={`/portal/bookings/${b._id}`} className="flex items-center justify-between">
                  <span className="font-medium text-ink-900">{b.bookingNumber}</span>
                  <StatusBadge status={b.status} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Invoices" action={<Link to="/portal/invoices" className="text-sm text-brand-700">All</Link>} />
          <CardBody className="space-y-3 text-sm">
            {invoices.length === 0 ? (
              <p className="text-ink-500">No invoices yet.</p>
            ) : (
              invoices.map((inv) => (
                <Link key={inv._id} to={`/portal/invoices/${inv._id}`} className="flex items-center justify-between">
                  <span className="font-medium text-ink-900">{inv.invoiceNumber}</span>
                  <span>{formatMoney(inv.amountDue ?? inv.total)}</span>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
