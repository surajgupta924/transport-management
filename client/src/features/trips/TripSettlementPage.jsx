import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useGetSettlementBoardQuery, useRecordAdvanceMutation, useSettleTripMutation } from '../settlements/settlementsApi'
import { useGetTripsQuery } from './tripsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal, StatCard } from '../../components/ui/OpsUi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

export function TripSettlementPage() {
  const toast = useToast()
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ tripId: '', amount: '', notes: '' })
  const { data, isFetching } = useGetSettlementBoardQuery(filter ? { status: filter } : {})
  const { data: tripData } = useGetTripsQuery({ limit: 100, accepted: 'true' })
  const [recordAdvance, { isLoading: saving }] = useRecordAdvanceMutation()
  const [settleTrip, { isLoading: settling }] = useSettleTripMutation()
  const rows = data?.data || []
  const stats = data?.meta || {}
  const trips = tripData?.data || []
  const visible = rows.filter((row) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [row.shipmentNumber, row.driver?.name, row.vehicle?.registrationNumber, row.route].join(' ').toLowerCase().includes(q)
  })

  const saveAdvance = async () => {
    try {
      await recordAdvance({ tripId: form.tripId, amount: Number(form.amount), notes: form.notes }).unwrap()
      toast.success('Driver advance recorded')
      setOpen(false)
      setForm({ tripId: '', amount: '', notes: '' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Trip Settlement & Driver Advances"
        description="Record driver trip advances, track approved diesel & expenses, and complete final settlements."
        action={
          <Can permission="expenses:approve">
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Record Driver Advance</Button>
          </Can>
        }
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total trips" value={stats.totalTrips || rows.length} tone="blue" />
        <StatCard label="Total advances given" value={formatMoney(stats.totalAdvances)} tone="amber" />
        <StatCard label="Approved expenses" value={formatMoney(stats.approvedExpenses)} tone="green" />
        <StatCard label="Pending settlement" value={`${stats.pendingSettlement || 0} Trips`} tone="violet" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input className="flex-1" placeholder="Search shipment, driver, vehicle or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {[['','All Trips'], ['pending','Pending Settlement'], ['settled','Settled']].map(([value, label]) => (
          <button key={label} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm ${filter === value ? 'bg-slate-900 text-white' : 'bg-white shadow-sm'}`}>{label}</button>
        ))}
      </div>
      <Card>
        <CardBody className={`p-0 ${isFetching ? 'opacity-60' : ''}`}>
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Shipment & route</th>
                <th className="px-4 py-3 text-left">Driver & vehicle</th>
                <th className="px-4 py-3 text-left">Advance (given)</th>
                <th className="px-4 py-3 text-left">Expenses (approved)</th>
                <th className="px-4 py-3 text-left">Net balance</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row._id} className="border-t border-ink-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-blue-700">{row.shipmentNumber || row.trip?.tripNumber}</p>
                    <p className="text-xs text-ink-500">{row.route}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{row.driver?.name || '—'}</p>
                    <p className="text-xs text-ink-500">{row.vehicle?.registrationNumber || '—'} {row.vehicle?.ownership === 'HIRED' ? <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">Hired</span> : null}</p>
                  </td>
                  <td className="px-4 py-3">{formatMoney(row.advanceGiven)}</td>
                  <td className="px-4 py-3">{formatMoney(row.expensesApproved)} <span className="text-xs text-ink-400">{row.expenseCount || 0} items</span></td>
                  <td className={`px-4 py-3 font-medium ${row.netBalance < 0 ? 'text-emerald-700' : row.netBalance > 0 ? 'text-rose-600' : ''}`}>
                    {formatMoney(Math.abs(row.netBalance))}
                    <p className="text-[11px] font-normal text-ink-400">{row.netBalance < 0 ? 'To driver' : row.netBalance > 0 ? 'Pay to driver' : 'Balanced'}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {row.status !== 'SETTLED' && (
                      <Can permission="expenses:approve">
                        <Button size="sm" loading={settling} onClick={async () => {
                          try {
                            await settleTrip(row._id).unwrap()
                            toast.success('Trip settled')
                          } catch (err) {
                            toast.error(getErrorMessage(err))
                          }
                        }}>+ Settle / Details</Button>
                      </Can>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <Modal open={open} title="Record Driver Advance" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Select label="Trip" required value={form.tripId} onChange={(e) => setForm((s) => ({ ...s, tripId: e.target.value }))}>
            <option value="">Select trip</option>
            {trips.map((trip) => (
              <option key={trip._id} value={trip._id}>{trip.booking?.shipmentNumber || trip.tripNumber} · {trip.driver?.name || 'No driver'}</option>
            ))}
          </Select>
          <Input label="Amount (INR)" required type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={saveAdvance}>Save Advance</Button>
        </div>
      </Modal>
    </div>
  )
}
