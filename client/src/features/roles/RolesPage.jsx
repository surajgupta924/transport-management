import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
} from './rolesApi'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'
import { Shield } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, 'Select at least one permission'),
})

export function RolesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useGetRolesQuery({ search: search || undefined, limit: 50 })
  const { data: permData } = useGetPermissionsQuery()
  const [createRole, { isLoading: creating }] = useCreateRoleMutation()
  const [deleteRole] = useDeleteRoleMutation()
  const [showForm, setShowForm] = useState(false)

  const roles = data?.data || []
  const permissions = permData?.data || []

  const grouped = useMemo(() => {
    return permissions.reduce((acc, p) => {
      acc[p.module] = acc[p.module] || []
      acc[p.module].push(p)
      return acc
    }, {})
  }, [permissions])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '', permissionIds: [] },
  })

  const selected = watch('permissionIds') || []

  const togglePermission = (id) => {
    if (selected.includes(id)) {
      setValue(
        'permissionIds',
        selected.filter((x) => x !== id),
        { shouldValidate: true }
      )
    } else {
      setValue('permissionIds', [...selected, id], { shouldValidate: true })
    }
  }

  const onCreate = async (values) => {
    try {
      await createRole(values).unwrap()
      toast.success('Role created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onDelete = async (role) => {
    if (role.isSystem) {
      toast.error('System roles cannot be deleted')
      return
    }
    if (!window.confirm(`Delete role "${role.name}"?`)) return
    try {
      await deleteRole(role._id).unwrap()
      toast.success('Role deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Roles & permissions</h1>
          <p className="text-sm text-ink-500">RBAC matrix controlling every module action</p>
        </div>
        <Can permission="roles:manage">
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close form' : 'Create custom role'}</Button>
        </Can>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="New role" description="Compose any permission set for a custom role" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Name" required error={errors.name?.message} {...register('name')} />
                <Input label="Slug" required hint="e.g. branch-manager" error={errors.slug?.message} {...register('slug')} />
              </div>
              <Input label="Description" {...register('description')} />
              <div>
                <p className="mb-2 text-sm font-medium text-ink-700">Permissions</p>
                {errors.permissionIds && (
                  <p className="mb-2 text-xs text-danger-500">{errors.permissionIds.message}</p>
                )}
                <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border border-ink-100 p-4">
                  {Object.entries(grouped).map(([module, items]) => (
                    <div key={module}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{module}</p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((p) => {
                          const active = selected.includes(p._id)
                          return (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => togglePermission(p._id)}
                              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                                active
                                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                              }`}
                            >
                              {p.action}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" loading={creating}>
                Save role
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Role catalog"
          action={
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : roles.length === 0 ? (
            <EmptyState icon={Shield} title="No roles" />
          ) : (
            <div className="divide-y divide-ink-100">
              {roles.map((role) => (
                <div key={role._id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-ink-900">{role.name}</h3>
                      <Badge tone="neutral">{role.slug}</Badge>
                      {role.isSystem && <Badge tone="info">System</Badge>}
                      <Badge tone={role.status === 'ACTIVE' ? 'success' : 'warning'}>{role.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">{role.description || '—'}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(role.permissions || []).slice(0, 12).map((p) => (
                        <Badge key={p._id || p.code}>{p.code}</Badge>
                      ))}
                      {(role.permissions || []).length > 12 && (
                        <Badge tone="brand">+{role.permissions.length - 12} more</Badge>
                      )}
                    </div>
                  </div>
                  <Can permission="roles:manage">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={role.isSystem}
                      onClick={() => onDelete(role)}
                    >
                      Delete
                    </Button>
                  </Can>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
