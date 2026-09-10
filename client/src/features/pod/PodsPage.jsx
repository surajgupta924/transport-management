import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useGetPodsQuery, useVerifyPodMutation } from './podApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

export function PodsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined, status: status || undefined }), [page, search, status])
  const { data, isLoading, refetch } = useGetPodsQuery(queryArgs)
  const [verifyPod] = useVerifyPodMutation()
  const rows = data?.data || []
  const reached = rows.filter((r) => r.status === 'PENDING').length
  const uploaded = rows.filter((r) => r.status === 'UPLOADED').length
  const review = uploaded
  const completed = rows.filter((r) => r.status === 'VERIFIED').length

  const act = async (id, next, reason) => {
    try {
      await verifyPod({ id, status: next, reason }).unwrap()
      toast.success(next === 'VERIFIED' ? 'POD approved' : 'POD rejected')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="STEP 5 · FINAL DELIVERY"
        title="Delivery Closure & POD"
        description="POD upload, verification, and automatic trip closure after GPS arrival."
        action={<div className="flex gap-2"><Button variant="secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button><Link to="/app/tracking"><Button>Open Live Tracking</Button></Link></div>}
      />
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['1', 'GPS Delivery Reached', 'The destination will be marked as reached automatically after the required dwell time within the delivery geofence.'],
          ['2', 'Driver Upload POD', 'The driver uploads a signed receipt, delivery photo, or PDF; available GPS proof is also captured.'],
          ['3', 'Admin Verify POD', 'The administrator reviews the file and location proof, then approves it or rejects it with a reason.'],
          ['4', 'System Complete', 'Upon approval, the delivery is completed, GPS tracking stops, and the vehicle and driver are released automatically.'],
        ].map(([n, title, body]) => (
          <div key={n} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">{n}</div>
            <p className="font-medium text-ink-900">{title}</p>
            <p className="mt-1 text-xs text-ink-500">{body}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Delivery reached" value={reached} />
        <StatCard label="POD upload" value={uploaded} tone="blue" />
        <StatCard label="POD review" value={review} tone="green" />
        <StatCard label="Completed" value={completed} tone="green" />
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search shipment, vehicle or driver..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="w-48">
          <option value="">All deliveries</option>
          <option value="PENDING">Pending</option>
          <option value="UPLOADED">Uploaded</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>
      <Card>
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? <EmptyState title="No POD records" /> : (
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Shipment</th>
                  <th className="px-4 py-3 text-left">Route</th>
                  <th className="px-4 py-3 text-left">Vehicle / Driver</th>
                  <th className="px-4 py-3 text-left">Expected</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">POD</th>
                  <th className="px-4 py-3">Next action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((pod) => (
                  <tr key={pod._id} className="border-t border-ink-50">
                    <td className="px-4 py-3 font-medium text-blue-700">{pod.booking?.bookingNumber || pod.booking?.shipmentNumber || '—'}</td>
                    <td className="px-4 py-3">{pod.trip?.tripNumber || '—'}</td>
                    <td className="px-4 py-3">{pod.receiverName}</td>
                    <td className="px-4 py-3">{pod.receivedAt ? new Date(pod.receivedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={pod.status} /></td>
                    <td className="px-4 py-3">{pod.photoUrls?.[0] ? <a className="text-blue-700" href={pod.photoUrls[0]} target="_blank" rel="noreferrer">View POD</a> : '—'}</td>
                    <td className="px-4 py-3">
                      {pod.status === 'UPLOADED' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="success" onClick={() => act(pod._id, 'VERIFIED')}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => act(pod._id, 'REJECTED', 'Rejected by admin')}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
