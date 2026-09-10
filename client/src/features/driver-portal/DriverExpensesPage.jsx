import { useMemo, useState } from 'react'
import { Eye, Wallet } from 'lucide-react'
import { useCreateExpenseMutation, useGetExpensesQuery } from '../expenses/expensesApi'
import { useGetTripsQuery } from '../trips/tripsApi'
import { useUploadFilesMutation } from '../uploads/uploadsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage, mediaUrl } from '../../lib/utils'

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
  receiptName: '',
})

function shipmentOf(expense) {
  return (
    expense.trip?.booking?.shipmentNumber ||
    expense.trip?.booking?.bookingNumber ||
    expense.trip?.tripNumber ||
    'Unassigned'
  )
}

export function DriverExpensesPage() {
  const toast = useToast()
  const [form, setForm] = useState(empty())
  const { data: tripData } = useGetTripsQuery({ limit: 100, mine: true, accepted: 'true' })
  const { data, isFetching } = useGetExpensesQuery({ limit: 100, sort: '-createdAt', mine: true })
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation()
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

  const onFile = async (file) => {
    if (!file) return
    try {
      const result = await uploadFiles({ files: [file], folder: 'receipts' }).unwrap()
      const url = result?.data?.[0]?.url
      setForm((s) => ({ ...s, receiptUrl: url || '', receiptName: file.name }))
      toast.success('Receipt attached')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.tripId) return toast.error('Select an accepted trip')
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount')
    if (!form.receiptUrl) return toast.error('Receipt is required')
    try {
      const trip = trips.find((item) => item._id === form.tripId)
      await createExpense({
        tripId: form.tripId,
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
        receiptUrl: form.receiptUrl,
      }).unwrap()
      toast.success('Expense submitted')
      setForm(empty())
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="My Trip Expenses"
        description="Submit, track, and verify fuel, toll, parking, repair, and trip expenses."
      />

      <Card>
        <CardBody>
          <form onSubmit={save} className="space-y-4" noValidate>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">New trip expense</p>
            <div className="grid gap-3 md:grid-cols-3">
              <Select
                label="Accepted Trip"
                required
                value={form.tripId}
                onChange={(e) => setForm((s) => ({ ...s, tripId: e.target.value }))}
              >
                <option value="">Select accepted trip</option>
                {trips.map((trip) => (
                  <option key={trip._id} value={trip._id}>
                    {trip.booking?.shipmentNumber || trip.tripNumber} · {trip.vehicle?.registrationNumber || 'Vehicle'}
                  </option>
                ))}
              </Select>
              <Select
                label="Expense Type"
                required
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              >
                {TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Amount (INR)"
                required
                type="number"
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              />
              <Input
                label="Date"
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              />
              <Input
                label="Location"
                placeholder="Pump, toll plaza or workshop"
                value={form.location}
                onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
              />
              <Input
                label="Description"
                placeholder="Optional details"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              />
              {form.category === 'FUEL' ? (
                <Input
                  label="Litres (optional)"
                  type="number"
                  value={form.liters}
                  onChange={(e) => setForm((s) => ({ ...s, liters: e.target.value }))}
                />
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Receipt *</p>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-slate-50 px-4 py-3 text-sm text-ink-600 hover:border-blue-300 hover:bg-blue-50/50">
                  <Wallet className="h-4 w-4" />
                  <span>{form.receiptName || 'Choose File No file chosen'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </label>
                {form.receiptUrl ? (
                  <a className="mt-1 block text-xs text-blue-700" href={mediaUrl(form.receiptUrl)} target="_blank" rel="noreferrer">
                    View uploaded receipt
                  </a>
                ) : null}
              </div>
              <Button
                type="submit"
                loading={creating || uploading}
                className="h-12 min-w-[220px] bg-ink-950 hover:bg-ink-900"
              >
                Submit expense
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className={`space-y-4 ${isFetching ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Expense History</h3>
            <p className="text-sm text-ink-400">{rows.length} records</p>
          </div>
          {grouped.length === 0 ? (
            <p className="text-sm text-ink-500">No trip expenses yet. Submit fuel, toll, or parking against an accepted trip.</p>
          ) : (
            grouped.map(([shipment, items]) => {
              const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)
              const trip = items[0]?.trip
              return (
                <div key={shipment} className="rounded-2xl border border-ink-100 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Shipment: {shipment}</p>
                      <p className="text-xs text-ink-500">
                        Driver: {trip?.driver?.name || items[0]?.driver?.name || '—'} | Vehicle:{' '}
                        {trip?.vehicle?.registrationNumber || items[0]?.vehicle?.registrationNumber || '—'}
                      </p>
                    </div>
                    <p className="font-semibold">{formatMoney(total)}</p>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item._id} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="w-36 font-medium">{item.title}</span>
                        <span className="w-24">{formatMoney(item.amount)}</span>
                        {item.liters ? (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{Number(item.liters).toFixed(2)} Ltr</span>
                        ) : null}
                        <span className="text-ink-500">{item.date ? new Date(item.date).toLocaleDateString('en-CA') : ''}</span>
                        <span className="flex-1 text-ink-500">{item.location || item.notes}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.receiptUrl ? (
                          <a href={mediaUrl(item.receiptUrl)} target="_blank" rel="noreferrer" className="text-blue-600">
                            <Eye className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </CardBody>
      </Card>
    </div>
  )
}
