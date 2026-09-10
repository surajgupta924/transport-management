import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MapPin } from 'lucide-react'
import { useCreateBookingMutation } from '../bookings/bookingsApi'
import { selectCurrentUser } from '../auth/authSlice'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { INDIAN_STATES } from '../../lib/states'
import { MapPinPicker } from './MapPinPicker'

const emptyParty = {
  name: '',
  mobile: '',
  email: '',
  gstin: '',
  city: '',
  state: '',
  address: '',
  pincode: '',
  lat: '',
  lng: '',
}

const emptyForm = (user) => ({
  cargoDescription: '',
  weightKg: '',
  packages: 1,
  pickupDate: '',
  expectedDeliveryDate: '',
  paymentMode: 'TO_PAY',
  notes: '',
  consignor: {
    ...emptyParty,
    name: user?.name || user?.linkedCustomer?.name || '',
    mobile: user?.mobile || user?.linkedCustomer?.mobile || '',
    email: user?.email || user?.linkedCustomer?.email || '',
  },
  consignee: { ...emptyParty },
})

function partyFields(form, key, setForm) {
  return (
    <>
      <Input label="Name" value={form[key].name} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], name: e.target.value } }))} />
      <Input label="Mobile" placeholder="+91..." value={form[key].mobile} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], mobile: e.target.value } }))} />
      <Input label="Email" placeholder={key === 'consignor' ? 'sender@example.com' : 'receiver@example.com'} value={form[key].email} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], email: e.target.value } }))} />
      <Input label="GSTIN" placeholder="GST registration number" value={form[key].gstin} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], gstin: e.target.value } }))} />
      <Input label="City" placeholder="City" value={form[key].city} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], city: e.target.value } }))} />
      <Select label="State" value={form[key].state} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], state: e.target.value } }))}>
        <option value="">Select state</option>
        {INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}
      </Select>
      <Input label="Address" placeholder="Street, area..." value={form[key].address} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], address: e.target.value } }))} />
      <Input label="Pincode" placeholder="000000" value={form[key].pincode} onChange={(e) => setForm((s) => ({ ...s, [key]: { ...s[key], pincode: e.target.value } }))} />
    </>
  )
}

export function PortalBookingFormPage() {
  const user = useSelector(selectCurrentUser)
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => emptyForm(user))
  const [picker, setPicker] = useState(null)
  const [createBooking, { isLoading }] = useCreateBookingMutation()

  const close = () => navigate('/portal')

  const useGps = (key) => {
    if (!navigator.geolocation) {
      toast.error('GPS is not available in this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((s) => ({
          ...s,
          [key]: { ...s[key], lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) },
        }))
        toast.success('GPS pin captured')
      },
      () => toast.error('Could not read GPS. Allow location access and try again.')
    )
  }

  const submit = async () => {
    if (!form.consignor.city || !form.consignee.city) {
      toast.error('Pickup and delivery city are required')
      return
    }
    try {
      const customerId = user?.linkedCustomer?._id || user?.linkedCustomer
      await createBooking({
        customerId,
        source: 'ONLINE',
        clientName: (form.consignor.name || user?.name || '').trim().length >= 2 ? (form.consignor.name || user?.name) : undefined,
        clientEmail: form.consignor.email || user?.email || undefined,
        clientPhone: form.consignor.mobile || user?.mobile,
        paymentMode: form.paymentMode,
        status: 'PENDING',
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes,
        pickup: {
          name: form.consignor.name,
          contactName: form.consignor.name,
          contactPhone: form.consignor.mobile,
          city: form.consignor.city,
          state: form.consignor.state,
          pincode: form.consignor.pincode,
          scheduledAt: form.pickupDate || undefined,
          lat: form.consignor.lat ? Number(form.consignor.lat) : undefined,
          lng: form.consignor.lng ? Number(form.consignor.lng) : undefined,
          address: {
            line1: form.consignor.address,
            city: form.consignor.city,
            state: form.consignor.state,
            postalCode: form.consignor.pincode,
            lat: form.consignor.lat ? Number(form.consignor.lat) : undefined,
            lng: form.consignor.lng ? Number(form.consignor.lng) : undefined,
          },
        },
        delivery: {
          name: form.consignee.name,
          contactName: form.consignee.name,
          contactPhone: form.consignee.mobile,
          city: form.consignee.city,
          state: form.consignee.state,
          pincode: form.consignee.pincode,
          lat: form.consignee.lat ? Number(form.consignee.lat) : undefined,
          lng: form.consignee.lng ? Number(form.consignee.lng) : undefined,
          address: {
            line1: form.consignee.address,
            city: form.consignee.city,
            state: form.consignee.state,
            postalCode: form.consignee.pincode,
            lat: form.consignee.lat ? Number(form.consignee.lat) : undefined,
            lng: form.consignee.lng ? Number(form.consignee.lng) : undefined,
          },
        },
        consignor: { ...form.consignor, email: form.consignor.email.includes('@') ? form.consignor.email : '' },
        consignee: { ...form.consignee, email: form.consignee.email.includes('@') ? form.consignee.email : '' },
        cargo: {
          description: form.cargoDescription,
          weightKg: Number(form.weightKg) || 0,
          packages: Number(form.packages) || 1,
        },
        charges: { freight: 0 },
      }).unwrap()
      toast.success('Booking submitted')
      navigate('/portal/track')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div>
      <Modal open wide title="Create New Shipment" onClose={close}>
        <div className="mb-5 flex gap-2 text-xs font-medium">
          <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>1. Basic Info</span>
          <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2. Parties</span>
        </div>

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <Textarea className="md:col-span-2" label="Cargo description" placeholder="What are you shipping?" value={form.cargoDescription} onChange={(e) => setForm((s) => ({ ...s, cargoDescription: e.target.value }))} />
            <Input label="Weight (kg)" type="number" value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} />
            <Input label="Packages" type="number" value={form.packages} onChange={(e) => setForm((s) => ({ ...s, packages: e.target.value }))} />
            <Input label="Pickup date" type="datetime-local" value={form.pickupDate} onChange={(e) => setForm((s) => ({ ...s, pickupDate: e.target.value }))} />
            <Input label="Expected delivery" type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm((s) => ({ ...s, expectedDeliveryDate: e.target.value }))} />
            <Select label="Payment mode" value={form.paymentMode} onChange={(e) => setForm((s) => ({ ...s, paymentMode: e.target.value }))}>
              <option value="PREPAID">Prepaid</option>
              <option value="TO_PAY">To pay</option>
              <option value="CREDIT">Credit</option>
            </Select>
            <Textarea className="md:col-span-2" label="Remarks" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              {partyFields(form, 'consignor', setForm)}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Exact Pickup Map Pin</p>
                    <p className="text-xs text-blue-700/80">Optional, but recommended for accurate navigation.</p>
                  </div>
                  <Button size="sm" onClick={() => useGps('consignor')}>Use GPS</Button>
                </div>
                <Button variant="secondary" size="sm" className="mb-3" onClick={() => setPicker('consignor')}>
                  <MapPin className="h-4 w-4" /> Choose on Map
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Latitude" value={form.consignor.lat} onChange={(e) => setForm((s) => ({ ...s, consignor: { ...s.consignor, lat: e.target.value } }))} />
                  <Input label="Longitude" value={form.consignor.lng} onChange={(e) => setForm((s) => ({ ...s, consignor: { ...s.consignor, lng: e.target.value } }))} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {partyFields(form, 'consignee', setForm)}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Exact Delivery Map Pin</p>
                    <p className="text-xs text-emerald-700/80">Optional, but recommended for accurate navigation.</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => useGps('consignee')}>Use GPS</Button>
                </div>
                <Button variant="secondary" size="sm" className="mb-3" onClick={() => setPicker('consignee')}>
                  <MapPin className="h-4 w-4" /> Choose on Map
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Latitude" value={form.consignee.lat} onChange={(e) => setForm((s) => ({ ...s, consignee: { ...s.consignee, lat: e.target.value } }))} />
                  <Input label="Longitude" value={form.consignee.lng} onChange={(e) => setForm((s) => ({ ...s, consignee: { ...s.consignee, lng: e.target.value } }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep(1)}>{'< Back'}</Button>
          {step === 1 ? (
            <Button onClick={() => {
              if (!form.cargoDescription) {
                toast.error('Describe the cargo first')
                return
              }
              setStep(2)
            }}>Next</Button>
          ) : (
            <Button loading={isLoading} onClick={submit}>Submit Booking</Button>
          )}
        </div>
      </Modal>
      <MapPinPicker
        open={Boolean(picker)}
        title={picker === 'consignee' ? 'Choose delivery pin' : 'Choose pickup pin'}
        lat={picker ? form[picker].lat : ''}
        lng={picker ? form[picker].lng : ''}
        onClose={() => setPicker(null)}
        onPick={(lat, lng) => setForm((s) => ({ ...s, [picker]: { ...s[picker], lat: lat.toFixed(6), lng: lng.toFixed(6) } }))}
      />
    </div>
  )
}
