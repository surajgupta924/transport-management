import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileCheck2, RefreshCw } from 'lucide-react'
import { useCreatePodMutation, useGetPodsQuery } from '../pod/podApi'
import { useGetTripsQuery } from '../trips/tripsApi'
import { useUploadFilesMutation } from '../uploads/uploadsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { StatCard, Modal } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, mediaUrl } from '../../lib/utils'

const STEPS = [
  ['1', 'GPS Delivery Reached', 'The destination will be marked as reached automatically after the required dwell time within the delivery geofence.'],
  ['2', 'Driver Upload POD', 'The driver uploads a signed receipt, delivery photo, or PDF; available GPS proof is also captured.'],
  ['3', 'Admin Verify POD', 'The administrator reviews the file and location proof, then approves it or rejects it with a reason.'],
  ['4', 'System Complete', 'Upon approval, the delivery is completed, GPS tracking stops, and the vehicle and driver are released automatically.'],
]

function shipmentOf(row) {
  return row.booking?.shipmentNumber || row.booking?.bookingNumber || row.trip?.tripNumber || '—'
}

export function DriverPodPage() {
  const toast = useToast()
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(Boolean(params.get('tripId')))
  const [form, setForm] = useState({
    tripId: params.get('tripId') || '',
    receivedBy: '',
    remarks: '',
    photoUrl: '',
    photoName: '',
  })
  const { data, isLoading, refetch, isFetching } = useGetPodsQuery({ limit: 50 })
  const { data: tripData } = useGetTripsQuery({ limit: 100, mine: true, accepted: 'true' })
  const [createPod, { isLoading: creating }] = useCreatePodMutation()
  const [uploadFiles, { isLoading: uploading }] = useUploadFilesMutation()
  const rows = data?.data || []
  const trips = tripData?.data || []
  const reached = rows.filter((r) => r.status === 'PENDING').length
  const uploaded = rows.filter((r) => r.status === 'UPLOADED').length
  const completed = rows.filter((r) => ['VERIFIED', 'APPROVED'].includes(r.status)).length

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status && row.status !== status) return false
      if (!q) return true
      const hay = [shipmentOf(row), row.trip?.tripNumber, row.trip?.vehicle?.registrationNumber, row.trip?.driver?.name, row.booking?.pickup?.city, row.booking?.delivery?.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, status])

  const onFile = async (file) => {
    if (!file) return
    try {
      const result = await uploadFiles({ files: [file], folder: 'pods' }).unwrap()
      const url = result?.data?.[0]?.url
      setForm((s) => ({ ...s, photoUrl: url || '', photoName: file.name }))
      toast.success('POD file attached')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const submit = async () => {
    if (!form.tripId) return toast.error('Select a trip')
    if (!form.receivedBy.trim()) return toast.error('Enter who received the goods')
    if (!form.photoUrl) return toast.error('Upload a POD photo or PDF')
    try {
      await createPod({
        tripId: form.tripId,
        receivedBy: form.receivedBy,
        remarks: form.remarks,
        photoUrl: form.photoUrl,
      }).unwrap()
      toast.success('POD submitted for admin verification')
      setForm({ tripId: '', receivedBy: '', remarks: '', photoUrl: '', photoName: '' })
      setOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const nextAction = (pod) => {
    if (pod.status === 'UPLOADED') return <span className="text-sm text-ink-400">Under verification</span>
    if (['VERIFIED', 'APPROVED'].includes(pod.status)) return <span className="text-sm text-emerald-600">Closed</span>
    if (pod.status === 'REJECTED') {
      return (
        <Button size="sm" onClick={() => { setForm((s) => ({ ...s, tripId: pod.trip?._id || pod.tripId || '' })); setOpen(true) }}>
          Re-upload POD
        </Button>
      )
    }
    return (
      <Button size="sm" onClick={() => { setForm((s) => ({ ...s, tripId: pod.trip?._id || pod.tripId || '' })); setOpen(true) }}>
        Upload POD
      </Button>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Delivery Closure & POD"
        description="POD upload, verification, and automatic trip closure after GPS arrival."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/driver/active">
              <Button>Open Live Tracking</Button>
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <p className="font-semibold text-ink-900">Automated delivery workflow</p>
        <p className="mt-1 text-sm text-ink-500">There is no routine status dropdown; GPS and POD actions drive verified transitions.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {STEPS.map(([n, title, body]) => (
            <div key={n} className="rounded-2xl border border-ink-100 bg-slate-50 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">{n}</div>
              <p className="font-medium text-ink-900">{title}</p>
              <p className="mt-1 text-xs text-ink-500">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-500">
          Exact pickup and delivery map pins are required. Arrival is recorded automatically when GPS accuracy is within the safe limit and the geofence dwell time is complete.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Delivery reached" value={reached} />
        <StatCard label="POD upload" value={rows.filter((r) => r.status === 'PENDING').length} tone="blue" />
        <StatCard label="POD review" value={uploaded} tone="green" />
        <StatCard label="Completed" value={completed} tone="green" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input placeholder="Search shipment, vehicle or driver..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
          <option value="">All deliveries</option>
          <option value="PENDING">Pending upload</option>
          <option value="UPLOADED">Under review</option>
          <option value="VERIFIED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Button onClick={() => setOpen(true)}>Upload POD</Button>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : visible.length === 0 ? (
            <EmptyState icon={FileCheck2} title="No POD records" description="Upload a signed receipt or delivery photo after GPS arrival." />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Shipment</th>
                  <th className="px-4 py-3 text-left">Route</th>
                  <th className="px-4 py-3 text-left">Vehicle / Driver</th>
                  <th className="px-4 py-3 text-left">Expected</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">POD</th>
                  <th className="px-4 py-3 text-left">Next action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((pod) => (
                  <tr key={pod._id} className="border-t border-ink-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-blue-700">{shipmentOf(pod)}</p>
                      <p className="text-xs text-ink-400">{pod.trip?.tripNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(pod.booking?.pickup?.city || '—').toLowerCase()} → {(pod.booking?.delivery?.city || '—').toLowerCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p>{pod.trip?.vehicle?.registrationNumber || '—'}</p>
                      <p className="text-xs text-ink-400">{pod.trip?.driver?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {pod.booking?.expectedDeliveryDate ? new Date(pod.booking.expectedDeliveryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pod.status === 'VERIFIED' ? 'COMPLETED' : pod.status} />
                      <p className="mt-1 text-xs text-ink-400">
                        Stage: {pod.status === 'UPLOADED' ? 'At Delivery' : pod.status === 'VERIFIED' ? 'Completed' : pod.status}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {pod.photoUrls?.[0] || pod.photoUrl ? (
                        <a className="text-blue-700" href={mediaUrl(pod.photoUrls?.[0] || pod.photoUrl)} target="_blank" rel="noreferrer">
                          View POD
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">{nextAction(pod)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} title="Upload proof of delivery" description="Attach a signed receipt, delivery photo, or PDF." onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Select label="Accepted trip" value={form.tripId} onChange={(e) => setForm((s) => ({ ...s, tripId: e.target.value }))}>
            <option value="">Select trip</option>
            {trips.map((trip) => (
              <option key={trip._id} value={trip._id}>
                {trip.booking?.shipmentNumber || trip.tripNumber} · {trip.booking?.pickup?.city} → {trip.booking?.delivery?.city}
              </option>
            ))}
          </Select>
          <Input
            label="Received by"
            required
            value={form.receivedBy}
            onChange={(e) => setForm((s) => ({ ...s, receivedBy: e.target.value }))}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-700">POD file *</p>
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} />
            {form.photoName ? <p className="mt-1 text-xs text-ink-500">{form.photoName}</p> : null}
          </div>
          <Textarea label="Remarks" value={form.remarks} onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={creating || uploading} onClick={submit}>
            Submit POD
          </Button>
        </div>
      </Modal>
    </div>
  )
}
