import { useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useGetLedgerQuery } from './ledgerApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

export function LedgerPage() {
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(
    () => ({ page, limit: 20, search: search || undefined, customerId: customerId || undefined }),
    [page, search, customerId]
  )
  const { data, isLoading, isFetching } = useGetLedgerQuery(queryArgs)
  const rows = data?.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader title="Customer ledger" description="Running balance entries across invoices and payments" />
      <Card>
        <CardHeader
          title="Entries"
          action={
            <div className="flex gap-2">
              <Input placeholder="Customer ID" value={customerId} onChange={(e) => { setPage(1); setCustomerId(e.target.value) }} className="w-40" />
              <Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-44" />
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState icon={BookOpen} title="No ledger entries" description="Entries appear after invoices and payments." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Debit</th>
                    <th className="px-5 py-3 font-medium">Credit</th>
                    <th className="px-5 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50">
                      <td className="px-5 py-3">{r.date ? new Date(r.date).toLocaleDateString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">{r.customer?.name || '—'}</td>
                      <td className="px-5 py-3">{r.type || r.entryType}</td>
                      <td className="px-5 py-3">{r.debit ?? '—'}</td>
                      <td className="px-5 py-3">{r.credit ?? '—'}</td>
                      <td className="px-5 py-3 font-medium">{r.balance ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
