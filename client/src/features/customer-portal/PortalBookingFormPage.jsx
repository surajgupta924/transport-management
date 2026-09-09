import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useCreateBookingMutation } from '../bookings/bookingsApi'
import { useSendOtpMutation, useVerifyOtpMutation } from '../auth/authApi'
import { selectCurrentUser } from '../auth/authSlice'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const schema = z.object({
  email: z.string().email('Enter a real email address'),
  pickupName: z.string().optional(),
  pickupAddress: z.string().min(3, 'Pickup address is required'),
  pickupCity: z.string().min(2, 'Pickup city is required'),
  pickupState: z.string().min(2, 'Pickup state is required'),
  pickupPincode: z.string().min(4, 'Pickup PIN is required'),
  pickupLandmark: z.string().optional(),
  pickupContactName: z.string().min(2, 'Pickup contact name is required'),
  pickupContactPhone: z.string().min(8, 'Pickup phone is required'),
  pickupDate: z.string().min(1, 'Pickup date/time is required'),
  deliveryName: z.string().optional(),
  deliveryAddress: z.string().min(3, 'Delivery address is required'),
  deliveryCity: z.string().min(2, 'Delivery city is required'),
  deliveryState: z.string().min(2, 'Delivery state is required'),
  deliveryPincode: z.string().min(4, 'Delivery PIN is required'),
  deliveryLandmark: z.string().optional(),
  deliveryContactName: z.string().min(2, 'Delivery contact name is required'),
  deliveryContactPhone: z.string().min(8, 'Delivery phone is required'),
  deliveryDate: z.string().optional(),
  cargoDescription: z.string().min(2, 'Describe the cargo'),
  cargoMaterial: z.string().optional(),
  cargoQuantity: z.string().optional(),
  weightKg: z.coerce.number().min(0).optional(),
  volumeCbm: z.coerce.number().min(0).optional(),
  packages: z.coerce.number().min(1).optional(),
  vehicleTypeRequired: z.string().optional(),
})

export function PortalBookingFormPage() {
  const user = useSelector(selectCurrentUser)
  const navigate = useNavigate()
  const toast = useToast()
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [createBooking, { isLoading }] = useCreateBookingMutation()
  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation()
  const [verifyOtp, { isLoading: verifyingOtp }] = useVerifyOtpMutation()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || '',
      pickupName: '',
      pickupAddress: '',
      pickupCity: '',
      pickupState: '',
      pickupPincode: '',
      pickupLandmark: '',
      pickupContactName: user?.name || '',
      pickupContactPhone: user?.mobile || '',
      pickupDate: '',
      deliveryName: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryPincode: '',
      deliveryLandmark: '',
      deliveryContactName: '',
      deliveryContactPhone: '',
      deliveryDate: '',
      cargoDescription: '',
      cargoMaterial: '',
      cargoQuantity: '',
      weightKg: 0,
      volumeCbm: 0,
      packages: 1,
      vehicleTypeRequired: '',
    },
  })

  const requestOtp = async () => {
    const email = getValues('email')
    try {
      const res = await sendOtp({ email, purpose: 'BOOKING' }).unwrap()
      setDevOtp(res.data?.devOtp || '')
      toast.success(`OTP sent to ${email}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const confirmOtp = async () => {
    const email = getValues('email')
    try {
      const res = await verifyOtp({ email, code: otp, purpose: 'BOOKING' }).unwrap()
      setOtpToken(res.data?.otpToken || '')
      toast.success('Email verified')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onSubmit = async (values) => {
    if (!otpToken) {
      toast.error('Verify the OTP sent to your email before booking')
      return
    }
    try {
      const customerId = user?.linkedCustomer?._id || user?.linkedCustomer
      const res = await createBooking({
        customerId,
        source: 'ONLINE',
        otpToken,
        clientEmail: values.email,
        pickup: {
          name: values.pickupName,
          address: values.pickupAddress,
          city: values.pickupCity,
          state: values.pickupState,
          pincode: values.pickupPincode,
          landmark: values.pickupLandmark,
          contactName: values.pickupContactName,
          contactPhone: values.pickupContactPhone,
          date: values.pickupDate || undefined,
        },
        delivery: {
          name: values.deliveryName,
          address: values.deliveryAddress,
          city: values.deliveryCity,
          state: values.deliveryState,
          pincode: values.deliveryPincode,
          landmark: values.deliveryLandmark,
          contactName: values.deliveryContactName,
          contactPhone: values.deliveryContactPhone,
          date: values.deliveryDate || undefined,
        },
        cargo: {
          description: values.cargoDescription,
          material: values.cargoMaterial,
          quantity: values.cargoQuantity,
          weightKg: values.weightKg,
          volumeCbm: values.volumeCbm,
          packages: values.packages,
        },
        vehicleTypeRequired: values.vehicleTypeRequired,
        charges: { freight: 0 },
        paymentMode: 'TO_PAY',
        status: 'PENDING',
      }).unwrap()
      toast.success('Booking request submitted')
      navigate(`/portal/bookings/${res.data?._id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-900">New booking</h1>
        <Link to="/portal/bookings" className="text-sm text-brand-700">
          Cancel
        </Link>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader title="Verify email with OTP" />
          <CardBody className="space-y-3">
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" loading={sendingOtp} onClick={requestOtp}>
                Send OTP
              </Button>
              <Input placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <Button type="button" loading={verifyingOtp} onClick={confirmOtp}>
                Verify
              </Button>
            </div>
            {otpToken ? (
              <p className="text-xs font-medium text-emerald-700">Email verified. You can submit the booking.</p>
            ) : (
              <p className="text-xs text-ink-500">We send a 6-digit code to a real mailbox. Check spam if you do not see it.</p>
            )}
            {devOtp && <p className="text-xs text-amber-700">Dev OTP: {devOtp}</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Trip starting point (pickup)" />
          <CardBody className="space-y-3">
            <Input label="Location name" {...register('pickupName')} />
            <Input label="Full address" required error={errors.pickupAddress?.message} {...register('pickupAddress')} />
            <Input label="City" required error={errors.pickupCity?.message} {...register('pickupCity')} />
            <Input label="State" required error={errors.pickupState?.message} {...register('pickupState')} />
            <Input label="PIN code" required error={errors.pickupPincode?.message} {...register('pickupPincode')} />
            <Input label="Landmark" {...register('pickupLandmark')} />
            <Input label="Contact name" required error={errors.pickupContactName?.message} {...register('pickupContactName')} />
            <Input label="Contact phone" required error={errors.pickupContactPhone?.message} {...register('pickupContactPhone')} />
            <Input label="Pickup date & time" type="datetime-local" required error={errors.pickupDate?.message} {...register('pickupDate')} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Trip ending point (delivery)" />
          <CardBody className="space-y-3">
            <Input label="Location name" {...register('deliveryName')} />
            <Input label="Full address" required error={errors.deliveryAddress?.message} {...register('deliveryAddress')} />
            <Input label="City" required error={errors.deliveryCity?.message} {...register('deliveryCity')} />
            <Input label="State" required error={errors.deliveryState?.message} {...register('deliveryState')} />
            <Input label="PIN code" required error={errors.deliveryPincode?.message} {...register('deliveryPincode')} />
            <Input label="Landmark" {...register('deliveryLandmark')} />
            <Input label="Contact name" required error={errors.deliveryContactName?.message} {...register('deliveryContactName')} />
            <Input label="Contact phone" required error={errors.deliveryContactPhone?.message} {...register('deliveryContactPhone')} />
            <Input label="Delivery date & time" type="datetime-local" {...register('deliveryDate')} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Cargo" />
          <CardBody className="space-y-3">
            <Textarea label="Description" required error={errors.cargoDescription?.message} {...register('cargoDescription')} />
            <Input label="Material" {...register('cargoMaterial')} />
            <Input label="Quantity" {...register('cargoQuantity')} />
            <Input label="Weight (kg)" type="number" {...register('weightKg')} />
            <Input label="Volume (cbm)" type="number" {...register('volumeCbm')} />
            <Input label="Packages" type="number" {...register('packages')} />
            <Select label="Vehicle type needed" {...register('vehicleTypeRequired')}>
              <option value="">Any</option>
              <option value="LCV">LCV</option>
              <option value="HCV">HCV</option>
              <option value="Trailer">Trailer</option>
              <option value="Container">Container</option>
            </Select>
          </CardBody>
        </Card>
        <Button type="submit" className="w-full" loading={isLoading} disabled={!otpToken}>
          Submit booking
        </Button>
      </form>
    </div>
  )
}
