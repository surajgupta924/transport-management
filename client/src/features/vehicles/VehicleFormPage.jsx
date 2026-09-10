import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCreateVehicleMutation, useGetVehicleQuery, useUpdateVehicleMutation } from './vehiclesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, getFieldErrors } from '../../lib/utils'
import { Skeleton } from '../../components/common/EmptyState'

const schema = z.object({
  registrationNumber: z.string().min(4, 'Registration required'),
  type: z.string().min(1, 'Type required'),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  capacityKg: z.coerce.number().optional(),
  currentKm: z.coerce.number().min(0).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE']),
  fuelType: z.string().optional(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  gpsDeviceId: z.string().optional(),
})

export function VehicleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isLoading } = useGetVehicleQuery(id, { skip: !isEdit })
  const [createVehicle, { isLoading: creating }] = useCreateVehicleMutation()
  const [updateVehicle, { isLoading: updating }] = useUpdateVehicleMutation()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      registrationNumber: '',
      type: 'TRUCK',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      capacityKg: 0,
      currentKm: 0,
      status: 'AVAILABLE',
      fuelType: 'DIESEL',
      chassisNumber: '',
      engineNumber: '',
      gpsDeviceId: '',
    },
  })

  useEffect(() => {
    const v = data?.data
    if (!v) return
    reset({
      registrationNumber: v.registrationNumber || v.regNo || '',
      type: v.type || v.vehicleType || 'TRUCK',
      make: v.manufacturer || v.make || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      capacityKg: v.capacity?.weightKg || v.capacityKg || 0,
      currentKm: v.currentKm || 0,
      status: v.status || 'AVAILABLE',
      fuelType: v.fuelType || 'DIESEL',
      chassisNumber: v.chassisNumber || '',
      engineNumber: v.engineNumber || '',
      gpsDeviceId: v.gpsDeviceId || '',
    })
  }, [data, reset])

  const onSubmit = async (values) => {
    const payload = {
      registrationNumber: values.registrationNumber,
      type: values.type,
      manufacturer: values.make,
      model: values.model,
      year: values.year,
      capacity: { weightKg: values.capacityKg || 0 },
      currentKm: values.currentKm || 0,
      status: values.status,
      fuelType: values.fuelType === 'EV' ? 'ELECTRIC' : values.fuelType,
      chassisNumber: values.chassisNumber,
      engineNumber: values.engineNumber,
      gpsDeviceId: values.gpsDeviceId,
    }
    try {
      if (isEdit) {
        await updateVehicle({ id, ...payload }).unwrap()
        toast.success('Vehicle updated')
        navigate(`/app/vehicles/${id}`)
      } else {
        const res = await createVehicle(payload).unwrap()
        toast.success('Vehicle created')
        navigate(`/app/vehicles/${res.data?._id || ''}`)
      }
    } catch (err) {
      Object.entries(getFieldErrors(err)).forEach(([f, m]) => setError(f, { message: m }))
      toast.error(getErrorMessage(err))
    }
  }

  if (isEdit && isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={isEdit ? 'Edit vehicle' : 'New vehicle'}
        action={
          <Link to={isEdit ? `/app/vehicles/${id}` : '/app/vehicles'}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader title="Vehicle details" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input label="Registration" required error={errors.registrationNumber?.message} {...register('registrationNumber')} />
            <Select label="Type" {...register('type')}>
              <option value="TRUCK">Truck</option>
              <option value="TEMPO">Tempo</option>
              <option value="CONTAINER">Container</option>
              <option value="TRAILER">Trailer</option>
              <option value="PICKUP">Pickup</option>
              <option value="TANKER">Tanker</option>
              <option value="OTHER">Other</option>
            </Select>
            <Input label="Make" {...register('make')} />
            <Input label="Model" {...register('model')} />
            <Input label="Year" type="number" {...register('year')} />
            <Input label="Capacity (kg)" type="number" {...register('capacityKg')} />
            <Input label="Current KM" type="number" {...register('currentKm')} />
            <Select label="Fuel type" {...register('fuelType')}>
              <option value="DIESEL">Diesel</option>
              <option value="PETROL">Petrol</option>
              <option value="CNG">CNG</option>
              <option value="ELECTRIC">Electric</option>
            </Select>
            <Select label="Status" {...register('status')}>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On trip</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            <Input label="Chassis number" {...register('chassisNumber')} />
            <Input label="Engine number" {...register('engineNumber')} />
            <Input label="GPS Device ID / IMEI" hint="Used by the GPS provider webhook" {...register('gpsDeviceId')} />
          </CardBody>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" loading={creating || updating}>
            {isEdit ? 'Save changes' : 'Create vehicle'}
          </Button>
        </div>
      </form>
    </div>
  )
}
