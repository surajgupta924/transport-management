import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useCreateCustomerMutation,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
} from './customersApi'
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
  name: z.string().min(2, 'Name is required'),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().min(8, 'Mobile is required'),
  alternateMobile: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  source: z.enum(['ONLINE', 'OFFLINE', 'ADMIN', 'IMPORTED']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
})

export function CustomerFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isLoading } = useGetCustomerQuery(id, { skip: !isEdit })
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation()
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      mobile: '',
      alternateMobile: '',
      type: 'INDIVIDUAL',
      source: 'OFFLINE',
      status: 'ACTIVE',
      gstin: '',
      pan: '',
      creditLimit: 0,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      notes: '',
    },
  })

  useEffect(() => {
    const c = data?.data
    if (!c) return
    reset({
      name: c.name || '',
      company: c.company || '',
      email: c.email || '',
      mobile: c.mobile || '',
      alternateMobile: c.alternateMobile || '',
      type: c.type || 'INDIVIDUAL',
      source: c.source || 'OFFLINE',
      status: c.status || 'ACTIVE',
      gstin: c.gstin || '',
      pan: c.pan || '',
      creditLimit: c.creditLimit ?? 0,
      addressLine1: c.address?.line1 || c.addressLine1 || '',
      addressLine2: c.address?.line2 || c.addressLine2 || '',
      city: c.address?.city || c.city || '',
      state: c.address?.state || c.state || '',
      pincode: c.address?.pincode || c.pincode || '',
      notes: c.notes || '',
    })
  }, [data, reset])

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      email: values.email || undefined,
      address: {
        line1: values.addressLine1,
        line2: values.addressLine2,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
    }
    delete payload.addressLine1
    delete payload.addressLine2
    delete payload.city
    delete payload.state
    delete payload.pincode

    try {
      if (isEdit) {
        await updateCustomer({ id, ...payload }).unwrap()
        toast.success('Customer updated')
        navigate(`/app/customers/${id}`)
      } else {
        const res = await createCustomer(payload).unwrap()
        toast.success('Customer created')
        navigate(`/app/customers/${res.data?._id || ''}`)
      }
    } catch (err) {
      Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }))
      toast.error(getErrorMessage(err))
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={isEdit ? 'Edit customer' : 'New customer'}
        description="Identity, tax, credit, and billing address"
        action={
          <Link to={isEdit ? `/app/customers/${id}` : '/app/customers'}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader title="Identity" description="Primary contact details" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input label="Name" required error={errors.name?.message} {...register('name')} />
            <Input label="Company" error={errors.company?.message} {...register('company')} />
            <Input label="Mobile" required error={errors.mobile?.message} {...register('mobile')} />
            <Input label="Alternate mobile" {...register('alternateMobile')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Select label="Type" {...register('type')}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </Select>
            <Select label="Source" {...register('source')}>
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
              <option value="ADMIN">Admin</option>
              <option value="IMPORTED">Imported</option>
            </Select>
            <Select label="Status" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tax & credit" description="Finance profile" />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <Input label="GSTIN" {...register('gstin')} />
            <Input label="PAN" {...register('pan')} />
            <Input label="Credit limit" type="number" step="0.01" {...register('creditLimit')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Address" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input label="Address line 1" className="md:col-span-2" {...register('addressLine1')} />
            <Input label="Address line 2" className="md:col-span-2" {...register('addressLine2')} />
            <Input label="City" {...register('city')} />
            <Input label="State" {...register('state')} />
            <Input label="Pincode" {...register('pincode')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes" />
          <CardBody>
            <Textarea label="Internal notes" rows={4} {...register('notes')} />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={creating || updating}>
            {isEdit ? 'Save changes' : 'Create customer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
