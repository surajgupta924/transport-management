import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGetUsersQuery, useCreateUserMutation } from './usersApi'
import { useGetRolesQuery } from '../roles/rolesApi'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'
import { Users } from 'lucide-react'

const createSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  mobile: z.string().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Include uppercase')
    .regex(/[a-z]/, 'Include lowercase')
    .regex(/[0-9]/, 'Include a number'),
  roleId: z.string().min(1, 'Role is required'),
  portalType: z.enum(['STAFF', 'DRIVER', 'CUSTOMER']),
})

export function UsersPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, isFetching } = useGetUsersQuery(queryArgs)
  const { data: rolesData } = useGetRolesQuery({ limit: 100 })
  const [createUser, { isLoading: creating }] = useCreateUserMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: { portalType: 'STAFF', name: '', email: '', mobile: '', password: '', roleId: '' },
  })

  const users = data?.data || []
  const meta = data?.meta
  const roles = rolesData?.data || []

  const onCreate = async (values) => {
    try {
      await createUser(values).unwrap()
      toast.success('User created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Users</h1>
          <p className="text-sm text-ink-500">Manage staff, driver, and customer portal accounts</p>
        </div>
        <Can permission="users:create">
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close form' : 'Add user'}</Button>
        </Can>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Create user" description="Password must include upper, lower, and a number" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Name" required error={errors.name?.message} {...register('name')} />
              <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
              <Input label="Mobile" {...register('mobile')} />
              <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} />
              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-sm font-medium text-ink-700">
                  Role <span className="text-danger-500">*</span>
                </span>
                <select
                  className="h-10 rounded-md border border-ink-200 bg-white px-3 text-sm"
                  {...register('roleId')}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.roleId && <span className="text-xs text-danger-500">{errors.roleId.message}</span>}
              </label>
              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-sm font-medium text-ink-700">Portal type</span>
                <select className="h-10 rounded-md border border-ink-200 bg-white px-3 text-sm" {...register('portalType')}>
                  <option value="STAFF">Staff</option>
                  <option value="DRIVER">Driver</option>
                  <option value="CUSTOMER">Customer</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <Button type="submit" loading={creating}>
                  Create user
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Directory"
          description="Server-side search and pagination"
          action={
            <Input
              placeholder="Search name, email, mobile..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="w-64"
            />
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Try a different search or create a user." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Portal</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium text-ink-900">{user.name}</td>
                      <td className="px-5 py-3 text-ink-600">{user.email}</td>
                      <td className="px-5 py-3">{user.role?.name}</td>
                      <td className="px-5 py-3">
                        <Badge>{user.portalType}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={user.status === 'ACTIVE' ? 'success' : 'warning'}>{user.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && (
            <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm text-ink-500">
              <span>
                Page {meta.page} of {meta.totalPages} · {meta.total} users
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
