import { useMemo, useState } from 'react'
import { Plus, Eye, Check, X } from 'lucide-react'
import { useApproveExpenseMutation, useCreateExpenseMutation, useGetExpensesQuery, useRejectExpenseMutation } from '../expenses/expensesApi'
import { useGetTripsQuery } from './tripsApi'
import { useUploadFilesMutation } from '../uploads/uploadsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage, mediaUrl } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const TYPES = [
  { value: 'FUEL', label: 'Fuel / Diesel' },
  { value: 'PARKING', label: 'Parking Charge' },
  { value: 'TOLL', label: 'Toll' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'FOOD', label: 'Food' },
  { value: 'OTHER', label: 'Other' },
]

const empty = () => ({
  tripId: '',
  category: 'PARKING',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  description: '',
  liters: '',
  receiptUrl: '',
})

function shipmentOf(expense) {
  return expense.trip?.booking?.shipmentNumber || expense.trip?.booking?.bookingNumber || expense.trip?.tripNumber || 'Unassigned'
}

export function TripExpensesPage() {
  const toast = useToast()
  const [showForm, setShowForm] = useState(true)
  const [form, setForm] = useState(empty())
  const { data: tripData } = useGetTripsQuery({ limit: 100, accepted: 'true' })
  const { data, isFetching } = useGetExpensesQuery({ limit: 100, sort: '-createdAt' })
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation()
  const [approveExpense] = useApproveExpenseMutation()
  const [rejectExpense] = useRejectExpenseMutation()
  const [uploadFiles, { isLoading: uploading }] = useUploadFilesMutation()
  const trips = tripData?.data || []
  const rows = data?.data || []

  const grouped = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      const key = shipmentOf(row)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(row)
    }
    return [...map.entries()]
  }, [rows])

  const save = async () => {
    try {
      const trip = trips.find((item) => item._id === form.tripId)
      await createExpense({
        tripId: form.tripId || undefined,
        driverId: trip?.driver?._id || trip?.driver,
        vehicleId: trip?.vehicle?._id || trip?.vehicle,
        category: form.category,
        title: TYPES.find((item) => item.value === form.category)?.label || form.category,
        description: form.description,
        notes: form.description,
        amount: Number(form.amount),
        date: form.date,
        location: form.location,
        liters: form.liters ? Number(form.liters) : undefined,
        receiptUrl: form.receiptUrl || undefined,
      }).unwrap()
      toast.success('Expense saved')
      setForm(empty())
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onFile = async (file) => {
    if (!file) return
    try {
      const result = await uploadFiles({ files: [file], folder: 'receipts' }).unwrap()
      const url = result?.data?.[0]?.url
      setForm((s) => ({ ...s, receiptUrl: url || '' }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Trip Expenses"
        description="Submit, track, and verify fuel, toll, parking, repair, and trip expenses."
        action={
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> {showForm ? 'Close Form' : 'Add Expense'}
          </Button>
        }
      />
      {showForm && (
        <Card>
          <CardBody className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Add manual trip expense (admin entry)</p>
            <div className="grid gap-3 md:grid-cols-3">
              <Select label="Accepted Trip" required value={form.tripId} onChange={(e) => setForm((s) => ({ ...s, tripId: e.target.value }))}>
                <option value="">Select accepted trip</option>
                {trips.map((trip) => (
                  <option key={trip._id} value={trip._id}>
                    {trip.booking?.shipmentNumber || trip.tripNumber} · {trip.driver?.name || 'No driver'}
                  </option>
                ))}
              </Select>
              <Select label="Expense Type" required value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
                {TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
              <Input label="Amount (INR)" required type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
              <Input label="Date" required type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
              <Input label="Location" placeholder="Pump, toll plaza or workshop" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
              <Input label="Litres (optional)" type="number" value={form.liters} onChange={(e) => setForm((s) => ({ ...s, liters: e.target.value }))} />
              <Textarea className="md:col-span-2" label="Description" placeholder="Optional details" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Receipt</p>
                <input type="file" accept="image/*,.pdf" onChange={(e) => onFile(e.target.files?.[0])} />
                {form.receiptUrl && <a className="mt-1 block text-xs text-blue-700" href={mediaUrl(form.receiptUrl)} target="_blank" rel="noreferrer">View uploaded file</a>}
              </div>
            </div>
            <Can permission="expenses:create">
              <Button loading={creating || uploading} onClick={save}>Save Manual Expense</Button>
            </Can>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardBody className={`space-y-4 ${isFetching ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Expense History</h3>
            <p className="text-sm text-ink-400">{rows.length} records</p>
          </div>
          {grouped.length === 0 ? <p className="text-sm text-ink-500">No trip expenses yet.</p> : grouped.map(([shipment, items]) => {
            const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)
            const trip = items[0]?.trip
            return (
              <div key={shipment} className="rounded-2xl border border-ink-100 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">Shipment: {shipment}</p>
                    <p className="text-xs text-ink-500">Driver: {trip?.driver?.name || items[0]?.driver?.name || '—'} | Vehicle: {trip?.vehicle?.registrationNumber || items[0]?.vehicle?.registrationNumber || '—'}</p>
                  </div>
                  <p className="font-semibold">{formatMoney(total)}</p>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item._id} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="w-36 font-medium">{item.title}</span>
                      <span className="w-24">{formatMoney(item.amount)}</span>
                      {item.liters ? <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{item.liters} Ltr</span> : null}
                      <span className="text-ink-500">{item.date ? new Date(item.date).toLocaleDateString('en-CA') : ''}</span>
                      <span className="flex-1 text-ink-500">{item.location || item.notes}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : item.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span>
                      {item.receiptUrl && <a href={mediaUrl(item.receiptUrl)} target="_blank" rel="noreferrer" className="text-blue-600"><Eye className="h-4 w-4" /></a>}
                      {item.status === 'PENDING' && (
                        <Can permission="expenses:approve">
                          <button type="button" className="rounded-full bg-emerald-600 p-1 text-white" onClick={() => approveExpense({ id: item._id })}><Check className="h-3.5 w-3.5" /></button>
                          <button type="button" className="rounded-full bg-rose-600 p-1 text-white" onClick={() => rejectExpense({ id: item._id, reason: 'Rejected from trip expenses' })}><X className="h-3.5 w-3.5" /></button>
                        </Can>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardBody>
      </Card>
    </div>
  )
}
