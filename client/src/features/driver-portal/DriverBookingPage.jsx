import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateBookingMutation } from '../bookings/bookingsApi'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const schema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email('Enter a real client email'),
  clientPhone: z.string().min(8, 'Client phone is required'),
  pickupAddress: z.string().min(3),
  pickupCity: z.string().min(2),
  pickupState: z.string().min(2),
  pickupPincode: z.string().min(4),
  pickupLandmark: z.string().optional(),
  pickupContactName: z.string().min(2),
  pickupContactPhone: z.string().min(8),
  pickupDate: z.string().min(1),
  deliveryAddress: z.string().min(3),
  deliveryCity: z.string().min(2),
  deliveryState: z.string().min(2),
  deliveryPincode: z.string().min(4),
  deliveryLandmark: z.string().optional(),
  deliveryContactName: z.string().min(2),
  deliveryContactPhone: z.string().min(8),
  deliveryDate: z.string().optional(),
  cargoDescription: z.string().min(2),
  cargoMaterial: z.string().optional(),
  cargoQuantity: z.string().optional(),
  weightKg: z.coerce.number().min(0).optional(),
  packages: z.coerce.number().min(1).optional(),
  vehicleTypeRequired: z.string().optional(),
})

export function DriverBookingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [createBooking, { isLoading }] = useCreateBookingMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      pickupAddress: '',
      pickupCity: '',
      pickupState: '',
      pickupPincode: '',
      pickupLandmark: '',
      pickupContactName: '',
      pickupContactPhone: '',
      pickupDate: '',
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
      packages: 1,
      vehicleTypeRequired: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      const res = await createBooking({
        source: 'OFFLINE',
        clientName: values.clientName,
        clientEmail: values.clientEmail,
        clientPhone: values.clientPhone,
        pickup: {
          address: values.pickupAddress,
          city: values.pickupCity,
          state: values.pickupState,
          pincode: values.pickupPincode,
          landmark: values.pickupLandmark,
          contactName: values.pickupContactName,
          contactPhone: values.pickupContactPhone,
          date: values.pickupDate,
        },
        delivery: {
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
          packages: values.packages,
        },
        vehicleTypeRequired: values.vehicleTypeRequired,
        charges: { freight: 0 },
        paymentMode: 'TO_PAY',
        status: 'PENDING',
      }).unwrap()
      toast.success(`Booking ${res.data?.bookingNumber || ''} created for ${values.clientName}`)
      navigate('/driver')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-900">Book for client</h1>
        <Link to="/driver" className="text-sm text-brand-700">Cancel</Link>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader title="Client details" />
          <CardBody className="space-y-3">
            <Input label="Client name" required error={errors.clientName?.message} {...register('clientName')} />
            <Input label="Client email" type="email" required error={errors.clientEmail?.message} {...register('clientEmail')} />
            <Input label="Client phone" required error={errors.clientPhone?.message} {...register('clientPhone')} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Starting point" />
          <CardBody className="space-y-3">
            <Input label="Address" required error={errors.pickupAddress?.message} {...register('pickupAddress')} />
            <Input label="City" required error={errors.pickupCity?.message} {...register('pickupCity')} />
            <Input label="State" required error={errors.pickupState?.message} {...register('pickupState')} />
            <Input label="PIN" required error={errors.pickupPincode?.message} {...register('pickupPincode')} />
            <Input label="Landmark" {...register('pickupLandmark')} />
            <Input label="Contact name" required error={errors.pickupContactName?.message} {...register('pickupContactName')} />
            <Input label="Contact phone" required error={errors.pickupContactPhone?.message} {...register('pickupContactPhone')} />
            <Input label="Pickup date & time" type="datetime-local" required error={errors.pickupDate?.message} {...register('pickupDate')} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Ending point" />
          <CardBody className="space-y-3">
            <Input label="Address" required error={errors.deliveryAddress?.message} {...register('deliveryAddress')} />
            <Input label="City" required error={errors.deliveryCity?.message} {...register('deliveryCity')} />
            <Input label="State" required error={errors.deliveryState?.message} {...register('deliveryState')} />
            <Input label="PIN" required error={errors.deliveryPincode?.message} {...register('deliveryPincode')} />
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
            <Input label="Packages" type="number" {...register('packages')} />
            <Select label="Vehicle type" {...register('vehicleTypeRequired')}>
              <option value="">Any</option>
              <option value="LCV">LCV</option>
              <option value="HCV">HCV</option>
              <option value="Trailer">Trailer</option>
            </Select>
          </CardBody>
        </Card>
        <Button type="submit" className="w-full" loading={isLoading}>
          Create booking
        </Button>
      </form>
    </div>
  )
}
