import { useState } from 'react'
import { Plus, RefreshCw, Truck } from 'lucide-react'
import {
  useCreateHiredPaymentMutation,
  useCreateHiredTripMutation,
  useCreateHiredVehicleMutation,
  useDeleteHiredVehicleMutation,
  useGetHiredDashboardQuery,
  useGetHiredPaymentsQuery,
  useGetHiredTripsQuery,
  useGetHiredVehiclesQuery,
} from './hiredVehiclesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal, StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'

const emptyVehicle = { registrationNumber: '', type: 'TRUCK', ownerName: '', ownerMobile: '', driverName: '', capacityTons: 0, hireRate: 0 }

export function HiredVehiclesPage() {
  const toast = useToast()
  const [tab, setTab] = useState('vehicles')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyVehicle)
  const { data: dashData, refetch } = useGetHiredDashboardQuery()
  const dash = dashData?.data || {}
  const { data: vehiclesData, isLoading } = useGetHiredVehiclesQuery({ search: search || undefined, limit: 50 })
  const { data: tripsData } = useGetHiredTripsQuery({ limit: 50 })
  const { data: paymentsData } = useGetHiredPaymentsQuery({ limit: 50 })
  const [createVehicle, { isLoading: saving }] = useCreateHiredVehicleMutation()
  const [createTrip] = useCreateHiredTripMutation()
  const [createPayment] = useCreateHiredPaymentMutation()
  const [removeVehicle] = useDeleteHiredVehicleMutation()
  const vehicles = vehiclesData?.data || []
  const trips = tripsData?.data || []
  const payments = paymentsData?.data || []

  const save = async () => {
    try {
      await createVehicle(form).unwrap()
      toast.success('Hired vehicle registered')
      setOpen(false)
      setForm(emptyVehicle)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Hired Vehicles"
        description="Manage market trucks, trips, charges and payments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Register Vehicle</Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total Vehicles" value={dash.totalVehicles || 0} icon={Truck} />
        <StatCard label="Total Trips" value={dash.totalTrips || 0} tone="violet" />
        <StatCard label="Total Freight" value={formatMoney(dash.totalFreight)} tone="green" />
        <StatCard label="Outstanding Balance" value={formatMoney(dash.outstandingBalance)} tone="rose" />
      </div>
      <div className="flex gap-2">
        {['vehicles', 'trips', 'payments'].map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === key ? 'bg-blue-600 text-white' : 'bg-white text-ink-600 shadow-sm'}`}>
            {key}
          </button>
        ))}
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="ml-auto w-56" />
      </div>
      <Card>
        <CardBody className="p-0">
          {tab === 'vehicles' && (isLoading ? <TableSkeleton /> : vehicles.length === 0 ? (
            <EmptyState icon={Truck} title="No hired vehicles" description="Register a market truck to start trips." />
          ) : (
            <div className="divide-y divide-ink-50">
              {vehicles.map((v) => (
                <div key={v._id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-ink-900">{v.registrationNumber} <StatusBadge status={v.status} /></p>
                    <p className="text-sm text-ink-500">{v.type} · Owner {v.ownerName || '—'} · Driver {v.driverName || '—'} · {v.capacityTons || 0} tons</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={async () => {
                      const origin = window.prompt('Origin city')
                      const destination = window.prompt('Destination city')
                      const freight = Number(window.prompt('Freight amount', '0'))
                      if (!origin) return
                      try {
                        await createTrip({ hiredVehicleId: v._id, origin, destination, freight, status: 'COMPLETED' }).unwrap()
                        toast.success('Trip recorded')
                      } catch (err) { toast.error(getErrorMessage(err)) }
                    }}>Add trip</Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (!window.confirm('Delete this hired vehicle?')) return
                      await removeVehicle(v._id)
                    }}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {tab === 'trips' && (
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500"><tr><th className="px-4 py-3 text-left">Vehicle</th><th className="px-4 py-3 text-left">Route</th><th className="px-4 py-3 text-left">Freight</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
              <tbody>{trips.map((t) => (
                <tr key={t._id} className="border-t border-ink-50">
                  <td className="px-4 py-3">{t.hiredVehicle?.registrationNumber}</td>
                  <td className="px-4 py-3">{t.origin} → {t.destination}</td>
                  <td className="px-4 py-3">{formatMoney(t.freight)}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'payments' && (
            <div className="p-5">
              <Button className="mb-4" onClick={async () => {
                const hiredVehicleId = vehicles[0]?._id
                const amount = Number(window.prompt('Amount'))
                if (!hiredVehicleId || !amount) return
                try {
                  await createPayment({ hiredVehicleId, amount, method: 'CASH' }).unwrap()
                  toast.success('Payment recorded')
                } catch (err) { toast.error(getErrorMessage(err)) }
              }}>Record payment</Button>
              <table className="min-w-full text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500"><tr><th className="px-4 py-3 text-left">Vehicle</th><th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">Method</th></tr></thead>
                <tbody>{payments.map((p) => (
                  <tr key={p._id} className="border-t border-ink-50">
                    <td className="px-4 py-3">{p.hiredVehicle?.registrationNumber}</td>
                    <td className="px-4 py-3">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3">{p.method}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <Modal open={open} title="Register hired vehicle" onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Registration number" required value={form.registrationNumber} onChange={(e) => setForm((s) => ({ ...s, registrationNumber: e.target.value }))} />
          <Select label="Type" value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}>
            {['TRUCK', 'CONTAINER', 'TRAILER', 'TEMPO', 'PICKUP', 'TANKER'].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Owner name" value={form.ownerName} onChange={(e) => setForm((s) => ({ ...s, ownerName: e.target.value }))} />
          <Input label="Owner mobile" value={form.ownerMobile} onChange={(e) => setForm((s) => ({ ...s, ownerMobile: e.target.value }))} />
          <Input label="Driver name" value={form.driverName} onChange={(e) => setForm((s) => ({ ...s, driverName: e.target.value }))} />
          <Input label="Capacity (tons)" type="number" value={form.capacityTons} onChange={(e) => setForm((s) => ({ ...s, capacityTons: Number(e.target.value) }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={save}>Register</Button>
        </div>
      </Modal>
    </div>
  )
}
