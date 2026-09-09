import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Truck } from 'lucide-react'
import { useGetVehiclesQuery } from './vehiclesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Can } from '../../hooks/usePermission'

export function VehiclesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(
    () => ({ page, limit: 10, search: search || undefined, status: status || undefined }),
    [page, search, status]
  )
  const { data, isLoading, isFetching } = useGetVehiclesQuery(queryArgs)
  const rows = data?.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Vehicles"
        description="Fleet registry, status, and documents"
        action={
          <Can permission="vehicles:create">
            <Link to="/app/vehicles/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add vehicle
              </Button>
            </Link>
          </Can>
        }
      />
      <Card>
        <CardHeader
          title="Fleet"
          action={
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search reg no..."
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
                className="w-40"
              >
                <option value="">All status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On trip</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState icon={Truck} title="No vehicles" description="Add a vehicle to the fleet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Registration</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Make / Model</th>
                    <th className="px-5 py-3 font-medium">KM</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((v) => (
                    <tr key={v._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium text-ink-900">{v.registrationNumber || v.regNo}</td>
                      <td className="px-5 py-3">{v.type || v.vehicleType}</td>
                      <td className="px-5 py-3 text-ink-600">
                        {[v.make, v.model].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-5 py-3">{v.currentKm ?? '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/app/vehicles/${v._id}`} className="font-medium text-brand-700 hover:underline">
                          View
                        </Link>
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
