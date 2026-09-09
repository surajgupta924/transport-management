import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, Plus } from 'lucide-react'
import { useGetCustomersQuery } from './customersApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Can } from '../../hooks/usePermission'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)

  const queryArgs = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      status: status || undefined,
      source: source || undefined,
    }),
    [page, search, status, source]
  )
  const { data, isLoading, isFetching } = useGetCustomersQuery(queryArgs)
  const customers = data?.data || []
  const meta = data?.meta

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Customers"
        description="CRM directory with source tracking and credit profiles"
        action={
          <Can permission="customers:create">
            <Link to="/app/customers/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            </Link>
          </Can>
        }
      />

      <Card>
        <CardHeader
          title="Directory"
          description="Search by name, company, mobile, or email"
          action={
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                className="w-48"
              />
              <Select
                value={status}
                onChange={(e) => {
                  setPage(1)
                  setStatus(e.target.value)
                }}
                className="w-36"
              >
                <option value="">All status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Select
                value={source}
                onChange={(e) => {
                  setPage(1)
                  setSource(e.target.value)
                }}
                className="w-36"
              >
                <option value="">All sources</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="ADMIN">Admin</option>
                <option value="IMPORTED">Imported</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : customers.length === 0 ? (
            <EmptyState icon={UserRound} title="No customers found" description="Create a customer to start bookings." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Mobile</th>
                    <th className="px-5 py-3 font-medium">Source</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {customers.map((c) => (
                    <tr key={c._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium text-ink-900">{c.name}</td>
                      <td className="px-5 py-3 text-ink-600">{c.company || '—'}</td>
                      <td className="px-5 py-3 text-ink-600">{c.mobile || '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.source} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/app/customers/${c._id}`} className="text-sm font-medium text-brand-700 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
