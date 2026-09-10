import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../auth/authSlice'
import { useChangePasswordMutation, useGetMeQuery } from '../auth/authApi'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function DriverProfilePage() {
  const user = useSelector(selectCurrentUser)
  const { data } = useGetMeQuery()
  const me = data?.data?.user || user
  const toast = useToast()
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap()
      toast.success('Password updated')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Profile" description="Your driver account and password." />
      <Card>
        <CardHeader title="Account" />
        <CardBody className="space-y-2 text-sm">
          <Row label="Name" value={me?.name} />
          <Row label="Email" value={me?.email} />
          <Row label="Mobile" value={me?.mobile} />
          <div className="flex justify-between">
            <span className="text-ink-500">Status</span>
            <StatusBadge status={me?.status} />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Change password" />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <Input
              label="Current password"
              type="password"
              required
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              required
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm"
              type="password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" className="w-full" loading={isLoading}>
              Update password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink-100 pb-2 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value || '—'}</span>
    </div>
  )
}
