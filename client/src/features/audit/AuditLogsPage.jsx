import { useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useGetAuditLogsQuery } from './auditApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(
    () => ({ page, limit: 20, search: search || undefined, module: module || undefined }),
    [page, search, module]
  )
  const { data, isLoading, isFetching } = useGetAuditLogsQuery(queryArgs)
  const rows = data?.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader title="Audit logs" description="Immutable activity trail across modules" />
      <Card>
        <CardHeader
          title="Activity"
          action={
            <div className="flex gap-2">
              <Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-44" />
              <Select value={module} onChange={(e) => { setPage(1); setModule(e.target.value) }} className="w-40">
                <option value="">All modules</option>
                <option value="users">Users</option>
                <option value="customers">Customers</option>
                <option value="bookings">Bookings</option>
                <option value="trips">Trips</option>
                <option value="invoices">Invoices</option>
                <option value="settings">Settings</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState icon={ScrollText} title="No audit entries" description="Actions will appear here as the system is used." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">When</th>
                    <th className="px-5 py-3 font-medium">Actor</th>
                    <th className="px-5 py-3 font-medium">Module</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Entity</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3">{r.actor?.name || r.actorName || '—'}</td>
                      <td className="px-5 py-3">{r.module}</td>
                      <td className="px-5 py-3 font-medium">{r.action}</td>
                      <td className="px-5 py-3 text-ink-600">
                        {r.entity} {r.entityId ? `#${String(r.entityId).slice(-6)}` : ''}
                      </td>
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
