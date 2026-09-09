import { Link, useParams } from 'react-router-dom'
import { useGetInvoiceQuery, useIssueInvoiceMutation } from './invoicesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, formatMoney } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isLoading } = useGetInvoiceQuery(id)
  const [issueInvoice, { isLoading: issuing }] = useIssueInvoiceMutation()
  const invoice = data?.data
  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!invoice) return <p className="text-sm text-ink-500">Invoice not found.</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={invoice.invoiceNumber || 'Invoice'}
        description={invoice.customer?.name}
        action={
          <div className="flex gap-2">
            <Can permission="invoices:edit">
              {invoice.status === 'DRAFT' && (
                <Button
                  loading={issuing}
                  onClick={async () => {
                    try {
                      await issueInvoice({ id, status: 'ISSUED' }).unwrap()
                      toast.success('Invoice issued')
                    } catch (err) {
                      toast.error(getErrorMessage(err))
                    }
                  }}
                >
                  Issue invoice
                </Button>
              )}
            </Can>
            <Link to="/app/invoices"><Button variant="secondary">Back</Button></Link>
          </div>
        }
      />
      <StatusBadge status={invoice.status} />
      <Card>
        <CardHeader title="Summary" />
        <CardBody className="space-y-2 text-sm">
          <Row label="Amount" value={formatMoney(invoice.amount)} />
          <Row label="Tax" value={formatMoney(invoice.taxAmount)} />
          <Row label="Total" value={formatMoney(invoice.totalAmount ?? invoice.amount)} />
          <Row label="Paid" value={formatMoney(invoice.paidAmount)} />
          <Row label="Due date" value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : null} />
          <Row label="Notes" value={invoice.notes} />
        </CardBody>
      </Card>
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

