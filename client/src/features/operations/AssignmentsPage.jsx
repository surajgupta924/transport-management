import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import {
  useAcceptAssignmentMutation,
  useAssignShipmentMutation,
  useGetAssignmentBoardQuery,
  useRejectAssignmentMutation,
  useReleaseAssignmentMutation,
} from '../trips/tripsApi'
import { useGetBookingsQuery } from '../bookings/bookingsApi'
import { useGetVehiclesQuery } from '../vehicles/vehiclesApi'
import { useGetDriversQuery } from '../drivers/driversApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Modal, StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

export function AssignmentsPage() {
  const toast = useToast()
  const { data, refetch, isFetching } = useGetAssignmentBoardQuery()
  const board = data?.data || {}
  const { data: readyData } = useGetBookingsQuery({ status: 'UNASSIGNED', limit: 50 })
  const { data: confirmedData } = useGetBookingsQuery({ status: 'CONFIRMED', limit: 50 })
  const { data: vehiclesData } = useGetVehiclesQuery({ status: 'AVAILABLE', limit: 50 })
  const { data: driversData } = useGetDriversQuery({ status: 'AVAILABLE', limit: 50 })
  const [assignShipment, { isLoading: assigning }] = useAssignShipmentMutation()
  const [accept] = useAcceptAssignmentMutation()
  const [reject] = useRejectAssignmentMutation()
  const [release] = useReleaseAssignmentMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ bookingId: '', vehicleId: '', driverId: '' })
  const ready = [...(readyData?.data || []), ...(confirmedData?.data || [])]
  const vehicles = vehiclesData?.data || []
  const drivers = driversData?.data || []

  const submit = async () => {
    try {
      await assignShipment(form).unwrap()
      toast.success('Vehicle and driver assigned')
      setOpen(false)
      setForm({ bookingId: '', vehicleId: '', driverId: '' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="STEP 3 · ASSIGNMENT"
        title="Fleet Assignment"
        description="Link the Approved/Unassigned shipment with an available vehicle and driver."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Assignment</Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Ready shipments" value={board.readyShipments || 0} tone="green" />
        <StatCard label="Pending approval" value={board.pendingApproval || 0} tone="amber" />
        <StatCard label="Available vehicles" value={board.availableVehicles || 0} tone="blue" />
        <StatCard label="Available drivers" value={board.availableDrivers || 0} tone="blue" />
      </div>
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Shipment</th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Driver</th>
                <th className="px-4 py-3 text-left">Assigned at</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className={isFetching ? 'opacity-60' : ''}>
              {(board.assignments || []).map((row) => (
                <tr key={row._id} className="border-t border-ink-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-blue-700">{row.booking?.shipmentNumber || row.booking?.bookingNumber}</p>
                    <p className="text-xs text-ink-400">{row.booking?.pickup?.city} → {row.booking?.delivery?.city}</p>
                  </td>
                  <td className="px-4 py-3">{row.vehicle?.registrationNumber || '—'}<div className="text-xs text-ink-400">{row.vehicle?.type}</div></td>
                  <td className="px-4 py-3">{row.driver?.name || '—'}<div className="text-xs text-ink-400">{row.driver?.mobile}</div></td>
                  <td className="px-4 py-3 text-ink-500">{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.assignmentStatus || row.status} />
                    <div className="text-xs text-ink-400">Shipment: {row.booking?.status}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.assignmentStatus === 'ASSIGNED' && (
                        <>
                          <Button size="sm" variant="success" onClick={() => accept(row._id)}>Accept</Button>
                          <Button size="sm" variant="danger" onClick={() => reject({ id: row._id, reason: 'Rejected from assignment board' })}>Reject</Button>
                        </>
                      )}
                      {row.assignmentStatus !== 'RELEASED' && row.status !== 'CANCELLED' && (
                        <Button size="sm" variant="ghost" onClick={() => release(row._id)}>Release</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <Modal open={open} title="New assignment" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Select label="Shipment" value={form.bookingId} onChange={(e) => setForm((s) => ({ ...s, bookingId: e.target.value }))}>
            <option value="">Select unassigned shipment</option>
            {ready.map((b) => (
              <option key={b._id} value={b._id}>{b.shipmentNumber || b.bookingNumber} · {b.pickup?.city} → {b.delivery?.city}</option>
            ))}
          </Select>
          <Select label="Vehicle" value={form.vehicleId} onChange={(e) => setForm((s) => ({ ...s, vehicleId: e.target.value }))}>
            <option value="">Available vehicle</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} ({v.type})</option>)}
          </Select>
          <Select label="Driver" value={form.driverId} onChange={(e) => setForm((s) => ({ ...s, driverId: e.target.value }))}>
            <option value="">Available driver</option>
            {drivers.map((d) => <option key={d._id} value={d._id}>{d.name} · {d.mobile}</option>)}
          </Select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={assigning} onClick={submit}>Assign</Button>
        </div>
      </Modal>
    </div>
  )
}
