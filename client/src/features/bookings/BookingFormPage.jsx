import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useCreateBookingMutation, useGetBookingQuery, useUpdateBookingMutation } from './bookingsApi'
import { useGetCustomersQuery } from '../customers/customersApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, getFieldErrors } from '../../lib/utils'
import { Skeleton } from '../../components/common/EmptyState'

const schema = z.object({
  customerId: z.string().optional(),
  source: z.enum(['ONLINE', 'OFFLINE', 'ADMIN']),
  pickupAddress: z.string().min(3),
  pickupCity: z.string().min(2),
  pickupState: z.string().optional(),
  pickupPincode: z.string().optional(),
  pickupLandmark: z.string().optional(),
  pickupContact: z.string().optional(),
  pickupContactName: z.string().optional(),
  pickupContactPhone: z.string().optional(),
  pickupDate: z.string().optional(),
  deliveryAddress: z.string().min(3),
  deliveryCity: z.string().min(2),
  deliveryState: z.string().optional(),
  deliveryPincode: z.string().optional(),
  deliveryLandmark: z.string().optional(),
  deliveryContact: z.string().optional(),
  deliveryContactName: z.string().optional(),
  deliveryContactPhone: z.string().optional(),
  deliveryDate: z.string().optional(),
  cargoDescription: z.string().min(2),
  cargoMaterial: z.string().optional(),
  cargoQuantity: z.string().optional(),
  weightKg: z.coerce.number().min(0).optional(),
  volumeCbm: z.coerce.number().min(0).optional(),
  packages: z.coerce.number().min(1).optional(),
  vehicleTypeRequired: z.string().optional(),
  freightCharge: z.coerce.number().min(0),
  otherCharges: z.coerce.number().min(0).optional(),
  paymentMode: z.enum(['PREPAID', 'TO_PAY', 'CREDIT']),
  remarks: z.string().optional(),
})

export function BookingFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const isPortal = location.pathname.startsWith('/portal')
  const toast = useToast()
  const { data, isLoading } = useGetBookingQuery(id, { skip: !isEdit })
  const { data: customersData } = useGetCustomersQuery(
    { limit: 100, status: 'ACTIVE' },
    { skip: isPortal }
  )
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation()
  const [updateBooking, { isLoading: updating }] = useUpdateBookingMutation()
  const customers = customersData?.data || []

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      source: isPortal ? 'ONLINE' : 'OFFLINE',
      pickupAddress: '',
      pickupCity: '',
      pickupState: '',
      pickupPincode: '',
      pickupLandmark: '',
      pickupContact: '',
      pickupContactName: '',
      pickupContactPhone: '',
      pickupDate: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryPincode: '',
      deliveryLandmark: '',
      deliveryContact: '',
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
      freightCharge: 0,
      otherCharges: 0,
      paymentMode: 'TO_PAY',
      remarks: '',
    },
  })

  useEffect(() => {
    const b = data?.data
    if (!b) return
    reset({
      customerId: b.customer?._id || b.customerId || '',
      source: b.source || 'OFFLINE',
      pickupAddress: b.pickup?.address || b.pickupAddress || '',
      pickupCity: b.pickup?.city || b.pickupCity || '',
      pickupState: b.pickup?.state || '',
      pickupPincode: b.pickup?.pincode || '',
      pickupLandmark: b.pickup?.landmark || '',
      pickupContact: b.pickup?.contact || '',
      pickupContactName: b.pickup?.contactName || '',
      pickupContactPhone: b.pickup?.contactPhone || '',
      pickupDate: b.pickup?.date ? String(b.pickup.date).slice(0, 16) : '',
      deliveryAddress: b.delivery?.address || b.deliveryAddress || '',
      deliveryCity: b.delivery?.city || b.destinationCity || '',
      deliveryState: b.delivery?.state || '',
      deliveryPincode: b.delivery?.pincode || '',
      deliveryLandmark: b.delivery?.landmark || '',
      deliveryContact: b.delivery?.contact || '',
      deliveryContactName: b.delivery?.contactName || '',
      deliveryContactPhone: b.delivery?.contactPhone || '',
      deliveryDate: b.delivery?.date ? String(b.delivery.date).slice(0, 16) : '',
      cargoDescription: b.cargo?.description || b.cargoDescription || '',
      cargoMaterial: b.cargo?.material || '',
      cargoQuantity: b.cargo?.quantity || '',
      weightKg: b.cargo?.weightKg || 0,
      volumeCbm: b.cargo?.volumeCbm || 0,
      packages: b.cargo?.packages || 1,
      vehicleTypeRequired: b.vehicleTypeRequired || '',
      freightCharge: b.charges?.freight || b.freightCharge || 0,
      otherCharges: b.charges?.other || 0,
      paymentMode: b.paymentMode || 'TO_PAY',
      remarks: b.remarks || '',
    })
  }, [data, reset])

  const onSubmit = async (values) => {
    if (!isPortal && !values.customerId) {
      setError('customerId', { message: 'Customer required' })
      return
    }
    const payload = {
      customerId: values.customerId,
      source: values.source,
      pickup: {
        address: values.pickupAddress,
        city: values.pickupCity,
        state: values.pickupState,
        pincode: values.pickupPincode,
        landmark: values.pickupLandmark,
        contact: values.pickupContact,
        contactName: values.pickupContactName,
        contactPhone: values.pickupContactPhone,
        date: values.pickupDate || undefined,
      },
      delivery: {
        address: values.deliveryAddress,
        city: values.deliveryCity,
        state: values.deliveryState,
        pincode: values.deliveryPincode,
        landmark: values.deliveryLandmark,
        contact: values.deliveryContact,
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
      charges: {
        freight: values.freightCharge,
        other: values.otherCharges || 0,
        total: Number(values.freightCharge) + Number(values.otherCharges || 0),
      },
      paymentMode: values.paymentMode,
      remarks: values.remarks,
    }

    try {
      if (isEdit) {
        await updateBooking({ id, ...payload }).unwrap()
        toast.success('Booking updated')
        navigate(isPortal ? `/portal/bookings/${id}` : `/app/bookings/${id}`)
      } else {
        const res = await createBooking(payload).unwrap()
        toast.success('Booking created')
        const createdId = res.data?._id || ''
        navigate(isPortal ? `/portal/bookings/${createdId}` : `/app/bookings/${createdId}`)
      }
    } catch (err) {
      Object.entries(getFieldErrors(err)).forEach(([f, m]) => setError(f, { message: m }))
      toast.error(getErrorMessage(err))
    }
  }

  if (isEdit && isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={isEdit ? 'Edit booking' : 'New booking'}
        description="Multi-section booking with pickup, delivery, cargo, and charges"
        action={
          <Link to={isEdit ? (isPortal ? `/portal/bookings/${id}` : `/app/bookings/${id}`) : isPortal ? '/portal/bookings' : '/app/bookings'}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader title="Customer & source" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {!isPortal && (
              <Select label="Customer" required error={errors.customerId?.message} {...register('customerId')}>
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.mobile ? `(${c.mobile})` : ''}
                  </option>
                ))}
              </Select>
            )}
            <Select label="Source" {...register('source')}>
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <Select label="Payment mode" {...register('paymentMode')}>
              <option value="TO_PAY">To pay</option>
              <option value="PREPAID">Prepaid</option>
              <option value="CREDIT">Credit</option>
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pickup" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input label="Address" required className="md:col-span-2" error={errors.pickupAddress?.message} {...register('pickupAddress')} />
            <Input label="City" required error={errors.pickupCity?.message} {...register('pickupCity')} />
            <Input label="State" {...register('pickupState')} />
            <Input label="Pincode" {...register('pickupPincode')} />
            <Input label="Landmark" {...register('pickupLandmark')} />
            <Input label="Contact name" {...register('pickupContactName')} />
            <Input label="Contact phone" {...register('pickupContactPhone')} />
            <Input label="Pickup date" type="datetime-local" {...register('pickupDate')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Delivery" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input label="Address" required className="md:col-span-2" error={errors.deliveryAddress?.message} {...register('deliveryAddress')} />
            <Input label="City" required error={errors.deliveryCity?.message} {...register('deliveryCity')} />
            <Input label="State" {...register('deliveryState')} />
            <Input label="Pincode" {...register('deliveryPincode')} />
            <Input label="Landmark" {...register('deliveryLandmark')} />
            <Input label="Contact name" {...register('deliveryContactName')} />
            <Input label="Contact phone" {...register('deliveryContactPhone')} />
            <Input label="Delivery date" type="datetime-local" {...register('deliveryDate')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cargo & charges" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Textarea label="Cargo description" required className="md:col-span-2" error={errors.cargoDescription?.message} {...register('cargoDescription')} />
            <Input label="Material" {...register('cargoMaterial')} />
            <Input label="Quantity" {...register('cargoQuantity')} />
            <Input label="Weight (kg)" type="number" {...register('weightKg')} />
            <Input label="Volume (cbm)" type="number" {...register('volumeCbm')} />
            <Input label="Packages" type="number" {...register('packages')} />
            <Select label="Vehicle type" {...register('vehicleTypeRequired')}>
              <option value="">Any</option>
              <option value="LCV">LCV</option>
              <option value="HCV">HCV</option>
              <option value="Trailer">Trailer</option>
              <option value="Container">Container</option>
            </Select>
            <Input label="Freight charge" type="number" required error={errors.freightCharge?.message} {...register('freightCharge')} />
            <Input label="Other charges" type="number" {...register('otherCharges')} />
            <Textarea label="Remarks" className="md:col-span-2" {...register('remarks')} />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={creating || updating}>
            {isEdit ? 'Save booking' : 'Create booking'}
          </Button>
        </div>
      </form>
    </div>
  )
}
