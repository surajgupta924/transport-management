import { Link } from 'react-router-dom'
import { useGetInvoicesQuery } from '../invoices/invoicesApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { formatMoney } from '../../lib/utils'
import { FileText } from 'lucide-react'

export function CustomerPortalInvoices() {
  const { data, isLoading } = useGetInvoicesQuery({ mine: true, limit: 50 })
  const invoices = data?.data || []

  if (isLoading) return <TableSkeleton rows={4} />
  if (!invoices.length) return <EmptyState icon={FileText} title="No invoices" />

  return (
    <div className="space-y-3">
      <h1 className="font-display text-xl font-semibold">Invoices</h1>
      {invoices.map((inv) => (
        <Link
          key={inv._id}
          to={`/portal/invoices/${inv._id}`}
          className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3"
        >
          <div>
            <p className="font-medium text-ink-900">{inv.invoiceNumber}</p>
            <p className="text-sm text-ink-500">{formatMoney(inv.total)} due {formatMoney(inv.amountDue)}</p>
          </div>
          <StatusBadge status={inv.status} />
        </Link>
      ))}
    </div>
  )
}
