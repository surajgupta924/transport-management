import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCreateDriverMutation, useGetDriverQuery, useUpdateDriverMutation } from './driversApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, getFieldErrors } from '../../lib/utils'
import { Skeleton } from '../../components/common/EmptyState'

const schema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(8),
  email: z.string().email().optional().or(z.literal('')),
  employeeId: z.string().optional(),
  licenseNumber: z.string().min(4),
  licenseExpiry: z.string().optional(),
  licenseType: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'INACTIVE']),
  salary: z.coerce.number().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
})

export function DriverFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isLoading } = useGetDriverQuery(id, { skip: !isEdit })
  const [createDriver, { isLoading: creating }] = useCreateDriverMutation()
  const [updateDriver, { isLoading: updating }] = useUpdateDriverMutation()

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', mobile: '', email: '', employeeId: '', licenseNumber: '', licenseExpiry: '',
      licenseType: 'HMV', status: 'AVAILABLE', salary: 0, address: '', emergencyContact: '',
    },
  })

  useEffect(() => {
    const d = data?.data
    if (!d) return
    reset({
      name: d.name || '',
      mobile: d.mobile || '',
      email: d.email || '',
      employeeId: d.employeeId || '',
      licenseNumber: d.licenseNumber || '',
      licenseExpiry: d.licenseExpiry ? String(d.licenseExpiry).slice(0, 10) : '',
      licenseType: d.licenseType || 'HMV',
      status: d.status || 'AVAILABLE',
      salary: d.salary || 0,
      address: d.address || '',
      emergencyContact: d.emergencyContact || '',
    })
  }, [data, reset])

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, email: values.email || undefined }
      if (isEdit) {
        await updateDriver({ id, ...payload }).unwrap()
        toast.success('Driver updated')
        navigate(`/app/drivers/${id}`)
      } else {
        const res = await createDriver(payload).unwrap()
        toast.success('Driver created')
        navigate(`/app/drivers/${res.data?._id || ''}`)
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
        title={isEdit ? 'Edit driver' : 'New driver'}
        action={
          <Link to={isEdit ? `/app/drivers/${id}` : '/app/drivers'}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader title="Profile" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input label="Name" required error={errors.name?.message} {...register('name')} />
            <Input label="Mobile" required error={errors.mobile?.message} {...register('mobile')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Employee ID" {...register('employeeId')} />
            <Input label="License number" required error={errors.licenseNumber?.message} {...register('licenseNumber')} />
            <Input label="License expiry" type="date" {...register('licenseExpiry')} />
            <Select label="License type" {...register('licenseType')}>
              <option value="LMV">LMV</option>
              <option value="HMV">HMV</option>
              <option value="TRAILER">Trailer</option>
            </Select>
            <Select label="Status" {...register('status')}>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On trip</option>
              <option value="OFF_DUTY">Off duty</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            <Input label="Salary" type="number" {...register('salary')} />
            <Input label="Emergency contact" {...register('emergencyContact')} />
            <Input label="Address" className="md:col-span-2" {...register('address')} />
          </CardBody>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" loading={creating || updating}>{isEdit ? 'Save changes' : 'Create driver'}</Button>
        </div>
      </form>
    </div>
  )
}
