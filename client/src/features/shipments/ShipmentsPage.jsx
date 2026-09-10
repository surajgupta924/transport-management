import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, RefreshCw, Search, Printer, Pencil, Trash2 } from 'lucide-react'
import {
  useCreateBookingMutation,
  useDeleteBookingMutation,
  useGetBookingStatsQuery,
  useGetBookingsQuery,
  useLazyGetBookingQuery,
  useUpdateBookingMutation,
  useUpdateBookingStatusMutation,
} from '../bookings/bookingsApi'
import { useGetCustomersQuery } from '../customers/customersApi'
import { useGetLoadingStaffQuery } from '../loading-staff/loadingStaffApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal, StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { INDIAN_STATES } from '../../lib/states'
import { Can } from '../../hooks/usePermission'
import { ShipmentLrPrint } from './ShipmentLrPrint'

const STATUSES = [
  { key: '', label: 'All', tone: 'slate' },
  { key: 'PENDING', label: 'Pending', tone: 'amber' },
  { key: 'UNASSIGNED', label: 'Unassigned', tone: 'slate' },
  { key: 'ASSIGNED', label: 'Assigned', tone: 'blue' },
  { key: 'IN_TRANSIT', label: 'In Transit', tone: 'violet' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', tone: 'amber' },
  { key: 'DELIVERED', label: 'Delivered', tone: 'green' },
  { key: 'COMPLETED', label: 'Completed', tone: 'green' },
]

const emptyParty = { name: '', company: '', mobile: '', email: '', gstin: '', city: '', state: '', address: '', pincode: '' }
const emptyForm = () => ({
  id: '',
  customerId: '',
  bookingDate: new Date().toISOString().slice(0, 10),
  containerNumber: '',
  stuffingDate: '',
  pickupDate: '',
  expectedDeliveryDate: '',
  fromCity: '',
  toCity: '',
  paymentMode: 'TO_PAY',
  status: 'PENDING',
  remarks: '',
  weightKg: 0,
  consignor: { ...emptyParty },
  consignee: { ...emptyParty },
  loadingStaffIds: [],
  packages: [{ type: '', quantity: 1, weightKg: 0, description: '', lengthCm: '', widthCm: '', heightCm: '' }],
  items: [{ name: '', hsn: '', quantity: 1, unit: 'PCS' }],
  charges: { freight: 0, loading: 0, unloading: 0, fuelSurcharge: 0, insurance: 0, other: 0, discount: 0, taxPercent: 18, gstTreatment: 'Forward Charge', placeOfSupply: '', sacCode: '9965' },
})

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function bookingToForm(booking) {
  return {
    id: booking._id,
    customerId: booking.customer?._id || booking.customer || '',
    bookingDate: toDateInput(booking.bookingDate || booking.createdAt),
    containerNumber: booking.containerNumber || '',
    stuffingDate: toDateInput(booking.stuffingDate),
    pickupDate: toDateInput(booking.pickup?.date || booking.pickup?.scheduledAt),
    expectedDeliveryDate: toDateInput(booking.expectedDeliveryDate),
    fromCity: booking.pickup?.city || booking.pickupCity || '',
    toCity: booking.delivery?.city || booking.destinationCity || '',
    paymentMode: booking.paymentMode || 'TO_PAY',
    status: ['PENDING', 'UNASSIGNED', 'CONFIRMED', 'ASSIGNED'].includes(booking.status) ? booking.status : booking.status,
    remarks: booking.notes || booking.remarks || '',
    weightKg: booking.cargo?.weightKg || 0,
    consignor: { ...emptyParty, ...(booking.consignor || {}) },
    consignee: { ...emptyParty, ...(booking.consignee || {}) },
    loadingStaffIds: (booking.loadingStaff || []).map((row) => row.staff?._id || row.staff).filter(Boolean),
    packages: booking.packages?.length ? booking.packages.map((pkg) => ({ type: '', quantity: 1, weightKg: 0, description: '', ...pkg })) : [{ type: '', quantity: 1, weightKg: 0, description: '' }],
    items: booking.items?.length ? booking.items.map((item) => ({ name: '', hsn: '', quantity: 1, unit: 'PCS', ...item })) : [{ name: '', hsn: '', quantity: 1, unit: 'PCS' }],
    charges: { freight: 0, loading: 0, unloading: 0, fuelSurcharge: 0, insurance: 0, other: 0, discount: 0, taxPercent: 18, gstTreatment: 'Forward Charge', placeOfSupply: '', sacCode: '9965', ...(booking.charges || {}) },
  }
}

function computePreview(charges) {
  const taxable = Math.max(0, Number(charges.freight) + Number(charges.loading) + Number(charges.unloading) + Number(charges.fuelSurcharge) + Number(charges.insurance) + Number(charges.other) - Number(charges.discount))
  const gst = Number(((taxable * Number(charges.taxPercent || 0)) / 100).toFixed(2))
  return { taxable, gst, total: Number((taxable + gst).toFixed(2)) }
}

function payloadFromForm(form, staff, editing = false) {
  const selectedStaff = staff.filter((s) => form.loadingStaffIds.includes(s._id))
  const payload = {
    customerId: form.customerId,
    source: 'ADMIN',
    paymentMode: form.paymentMode,
    containerNumber: form.containerNumber,
    bookingDate: form.bookingDate,
    stuffingDate: form.stuffingDate || undefined,
    expectedDeliveryDate: form.expectedDeliveryDate || undefined,
    notes: form.remarks,
    pickup: { city: form.fromCity, scheduledAt: form.pickupDate || undefined, address: { city: form.fromCity, line1: form.fromCity } },
    delivery: { city: form.toCity, address: { city: form.toCity, line1: form.toCity } },
    consignor: form.consignor,
    consignee: form.consignee,
    cargo: { weightKg: Number(form.weightKg) || 0, packages: form.packages.reduce((s, p) => s + Number(p.quantity || 0), 0), description: form.items.map((i) => i.name).filter(Boolean).join(', ') },
    packages: form.packages,
    items: form.items,
    loadingStaff: selectedStaff.map((s) => ({ staffId: s._id, rate: s.incentiveRate })),
    charges: form.charges,
  }
  if (!editing || ['DRAFT', 'PENDING', 'CONFIRMED', 'UNASSIGNED', 'ASSIGNED'].includes(form.status)) {
    payload.status = form.status
  }
  return payload
}

export function ShipmentsPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm())
  const [printRow, setPrintRow] = useState(null)
  const queryArgs = useMemo(
    () => ({ page, limit: 10, search: search || undefined, status: status || undefined }),
    [page, search, status]
  )
  const { data, isLoading, isFetching, refetch } = useGetBookingsQuery(queryArgs)
  const { data: statsData } = useGetBookingStatsQuery()
  const { data: customersData } = useGetCustomersQuery({ limit: 100, status: 'ACTIVE' })
  const { data: staffData } = useGetLoadingStaffQuery({ limit: 50, status: 'ACTIVE' })
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation()
  const [updateBooking, { isLoading: updating }] = useUpdateBookingMutation()
  const [updateStatus] = useUpdateBookingStatusMutation()
  const [deleteBooking] = useDeleteBookingMutation()
  const [loadBooking] = useLazyGetBookingQuery()
  const rows = data?.data || []
  const stats = statsData?.data || {}
  const customers = customersData?.data || []
  const staff = staffData?.data || []
  const preview = computePreview(form.charges)
  const editing = Boolean(form.id)

  useEffect(() => { setPage(1) }, [status])

  const setStatus = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('status', value)
    else next.delete('status')
    setParams(next)
  }

  const submit = async () => {
    try {
      const payload = payloadFromForm(form, staff, editing)
      if (editing) await updateBooking({ id: form.id, ...payload }).unwrap()
      else await createBooking(payload).unwrap()
      toast.success(editing ? 'Shipment updated' : 'Shipment created')
      setOpen(false)
      setStep(1)
      setForm(emptyForm())
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const openEdit = async (row) => {
    try {
      const result = await loadBooking(row._id).unwrap()
      setForm(bookingToForm(result.data || result))
      setStep(1)
      setOpen(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const openPrint = async (row) => {
    try {
      const result = await loadBooking(row._id).unwrap()
      setPrintRow(result.data || result)
    } catch {
      setPrintRow(row)
    }
  }

  const remove = async (row) => {
    if (!window.confirm(`Delete shipment ${row.shipmentNumber || row.bookingNumber}?`)) return
    try {
      await deleteBooking(row._id).unwrap()
      toast.success('Shipment deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const counts = {
    '': stats.total,
    PENDING: stats.pending,
    UNASSIGNED: stats.unassigned,
    ASSIGNED: stats.assigned,
    IN_TRANSIT: stats.inTransit,
    OUT_FOR_DELIVERY: stats.outForDelivery,
    DELIVERED: stats.delivered,
    COMPLETED: stats.completed,
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Shipments"
        description="Manage, track and update all shipments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Can permission="bookings:create">
              <Button onClick={() => { setForm(emptyForm()); setStep(1); setOpen(true) }}><Plus className="h-4 w-4" /> Create Shipment</Button>
            </Can>
          </div>
        }
      />
      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {STATUSES.map((s) => (
          <StatCard key={s.key || 'all'} label={s.label} value={counts[s.key] || 0} tone={s.tone} active={status === s.key} onClick={() => setStatus(s.key)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-ink-400" />
          <Input className="pl-9" placeholder="Search by shipment #, LR, ref number..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          <option value="">All Statuses</option>
          {STATUSES.filter((s) => s.key).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          <option value="POD_UPLOADED">POD Uploaded</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>
      <Card>
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState title="No shipments" description="Create a shipment to start the operations workflow." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Shipment</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Parties</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={isFetching ? 'opacity-60' : ''}>
                {rows.map((row) => (
                  <tr key={row._id} className="border-b border-ink-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-blue-700">{row.shipmentNumber || row.bookingNumber}</p>
                      <p className="text-xs text-ink-400">LR: {row.lrNumber || '—'}</p>
                    </td>
                    <td className="px-4 py-3">{row.pickup?.city || row.pickupCity || '—'} → {row.delivery?.city || row.destinationCity || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">From: {row.consignor?.name || row.customer?.name || '—'}<br />To: {row.consignee?.name || '—'}</td>
                    <td className="px-4 py-3 text-ink-500">{row.bookingDate ? new Date(row.bookingDate).toLocaleDateString() : new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openPrint(row)} title="Print LR"><Printer className="h-4 w-4" /></Button>
                        <Can permission="bookings:edit">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        </Can>
                        <Can permission="bookings:delete">
                          {['DRAFT', 'CANCELLED', 'PENDING', 'UNASSIGNED', 'CONFIRMED'].includes(row.status) && (
                            <Button size="sm" variant="ghost" onClick={() => remove(row)} title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                          )}
                        </Can>
                        {row.status === 'PENDING' && (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus({ id: row._id, status: 'UNASSIGNED' })}>Approve</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>

      <Modal open={open} wide title={editing ? 'Edit Shipment' : 'Create New Shipment'} onClose={() => setOpen(false)}>
        <div className="mb-5 flex gap-2 text-xs font-medium">
          {['Basic Info', 'Parties', 'Cargo & Items', 'Charges'].map((label, i) => (
            <span key={label} className={`rounded-full px-3 py-1 ${step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}. {label}</span>
          ))}
        </div>
        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <Select label="Customer" required value={form.customerId} onChange={(e) => setForm((s) => ({ ...s, customerId: e.target.value }))}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Booking Date" type="date" required value={form.bookingDate} onChange={(e) => setForm((s) => ({ ...s, bookingDate: e.target.value }))} />
            <Input label="Container Number" value={form.containerNumber} onChange={(e) => setForm((s) => ({ ...s, containerNumber: e.target.value }))} />
            <Input label="Weight (kg)" type="number" value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} />
            <Input label="Pickup Date" type="date" value={form.pickupDate} onChange={(e) => setForm((s) => ({ ...s, pickupDate: e.target.value }))} />
            <Input label="From (Origin / Pickup City)" required value={form.fromCity} onChange={(e) => setForm((s) => ({ ...s, fromCity: e.target.value }))} />
            <Input label="To (Destination / Delivery City)" required value={form.toCity} onChange={(e) => setForm((s) => ({ ...s, toCity: e.target.value }))} />
            <Select label="Payment Mode" required value={form.paymentMode} onChange={(e) => setForm((s) => ({ ...s, paymentMode: e.target.value }))}>
              <option value="PREPAID">Prepaid</option>
              <option value="TO_PAY">To pay</option>
              <option value="CREDIT">Credit</option>
            </Select>
            <Input label="Expected Delivery Date" type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm((s) => ({ ...s, expectedDeliveryDate: e.target.value }))} />
            <Select label="Status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
              <option value="PENDING">Pending</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="CONFIRMED">Confirmed</option>
            </Select>
            <Textarea className="md:col-span-2" label="Remarks" value={form.remarks} onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))} />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-6 md:grid-cols-2">
            {['consignor', 'consignee'].map((key) => (
              <div key={key} className="space-y-3 rounded-2xl border border-ink-100 p-4">
                <h4 className={`font-semibold ${key === 'consignor' ? 'text-blue-700' : 'text-emerald-700'}`}>{key === 'consignor' ? 'SENDER (CONSIGNOR)' : 'RECEIVER (CONSIGNEE)'}</h4>
                {['name', 'company', 'mobile', 'email', 'gstin', 'city', 'address', 'pincode'].map((field) => (
                  <Input key={field} label={field} value={form[key][field] || ''} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], [field]: e.target.value } }))} />
                ))}
                <Select label="State" value={form[key].state || ''} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], state: e.target.value } }))}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}
                </Select>
              </div>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="mb-2 text-sm font-semibold text-blue-800">LOADING STAFF ASSIGNMENT</p>
              <div className="space-y-2">
                {staff.map((s) => (
                  <label key={s._id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={form.loadingStaffIds.includes(s._id)} onChange={(e) => setForm((prev) => ({
                        ...prev,
                        loadingStaffIds: e.target.checked ? [...prev.loadingStaffIds, s._id] : prev.loadingStaffIds.filter((id) => id !== s._id),
                      }))} />
                      {s.name} ({s.designation})
                    </span>
                    <span className="text-emerald-700">{formatMoney(s.incentiveRate)}/{s.incentiveUnit === 'PER_KG' ? 'kg' : 'quintal'}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.packages.map((pkg, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-ink-100 p-3 md:grid-cols-4">
                <Input label="Type" value={pkg.type} onChange={(e) => setForm((s) => { const packages = [...s.packages]; packages[i] = { ...pkg, type: e.target.value }; return { ...s, packages } })} />
                <Input label="Quantity" type="number" value={pkg.quantity} onChange={(e) => setForm((s) => { const packages = [...s.packages]; packages[i] = { ...pkg, quantity: e.target.value }; return { ...s, packages } })} />
                <Input label="Weight (kg)" type="number" value={pkg.weightKg} onChange={(e) => setForm((s) => { const packages = [...s.packages]; packages[i] = { ...pkg, weightKg: e.target.value }; return { ...s, packages } })} />
                <Input label="Description" value={pkg.description} onChange={(e) => setForm((s) => { const packages = [...s.packages]; packages[i] = { ...pkg, description: e.target.value }; return { ...s, packages } })} />
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setForm((s) => ({ ...s, packages: [...s.packages, { type: '', quantity: 1, weightKg: 0, description: '' }] }))}>Add Package</Button>
            {form.items.map((item, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-4">
                <Input label="Item name" value={item.name} onChange={(e) => setForm((s) => { const items = [...s.items]; items[i] = { ...item, name: e.target.value }; return { ...s, items } })} />
                <Input label="HSN Code" value={item.hsn} onChange={(e) => setForm((s) => { const items = [...s.items]; items[i] = { ...item, hsn: e.target.value }; return { ...s, items } })} />
                <Input label="Quantity" type="number" value={item.quantity} onChange={(e) => setForm((s) => { const items = [...s.items]; items[i] = { ...item, quantity: e.target.value }; return { ...s, items } })} />
                <Input label="Unit" value={item.unit} onChange={(e) => setForm((s) => { const items = [...s.items]; items[i] = { ...item, unit: e.target.value }; return { ...s, items } })} />
              </div>
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-3 md:grid-cols-2">
            {[['freight', 'Freight Charge (INR)'], ['loading', 'Loading Charge (INR)'], ['unloading', 'Unloading Charge (INR)'], ['fuelSurcharge', 'Fuel Surcharge (INR)'], ['insurance', 'Insurance Charge (INR)'], ['other', 'Other Charge (INR)'], ['discount', 'Discount Amount (INR)'], ['taxPercent', 'GST Rate (%)']].map(([key, label]) => (
              <Input key={key} label={label} type="number" value={form.charges[key]} onChange={(e) => setForm((s) => ({ ...s, charges: { ...s.charges, [key]: e.target.value } }))} />
            ))}
            <Select label="GST Treatment" value={form.charges.gstTreatment} onChange={(e) => setForm((s) => ({ ...s, charges: { ...s.charges, gstTreatment: e.target.value } }))}>
              <option>Forward Charge</option>
              <option>Reverse Charge</option>
            </Select>
            <Input label="GST Amount (INR)" readOnly value={preview.gst} />
            <Select label="Place of Supply State" value={form.charges.placeOfSupply} onChange={(e) => setForm((s) => ({ ...s, charges: { ...s.charges, placeOfSupply: e.target.value } }))}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((st) => <option key={st}>{st}</option>)}
            </Select>
            <Input label="SAC Code" value={form.charges.sacCode} onChange={(e) => setForm((s) => ({ ...s, charges: { ...s.charges, sacCode: e.target.value } }))} />
            <Input label="Taxable Amount (INR)" readOnly value={preview.taxable} />
            <Input label="Total Amount (INR)" readOnly value={preview.total} />
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < 4 ? <Button onClick={() => setStep((s) => s + 1)}>Next</Button> : <Button loading={creating || updating} onClick={submit}>{editing ? 'Save Changes' : 'Create Shipment'}</Button>}
        </div>
      </Modal>
      {printRow && <ShipmentLrPrint booking={printRow} onClose={() => setPrintRow(null)} />}
    </div>
  )
}
