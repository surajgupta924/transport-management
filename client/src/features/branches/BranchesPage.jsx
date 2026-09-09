import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useCreateBranchMutation, useGetBranchesQuery, useUpdateBranchMutation } from './branchesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export function BranchesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, isFetching } = useGetBranchesQuery(queryArgs)
  const [createBranch, { isLoading: creating }] = useCreateBranchMutation()
  const [updateBranch] = useUpdateBranchMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', city: '', state: '', address: '', status: 'ACTIVE' },
  })

  const onCreate = async (values) => {
    try {
      await createBranch(values).unwrap()
      toast.success('Branch created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Branches"
        description="Operating locations"
        action={
          <Can permission="branches:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Add branch'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="New branch" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Name" required error={errors.name?.message} {...register('name')} />
              <Input label="Code" required error={errors.code?.message} {...register('code')} />
              <Input label="City" {...register('city')} />
              <Input label="State" {...register('state')} />
              <Input label="Address" className="md:col-span-2" {...register('address')} />
              <Select label="Status" {...register('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <div className="md:col-span-2">
                <Button type="submit" loading={creating}>Create</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader title="Branch list" action={<Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-48" />} />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="No branches" description="Create your first branch." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Code</th>
                    <th className="px-5 py-3 font-medium">City</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((b) => (
                    <tr key={b._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium">{b.name}</td>
                      <td className="px-5 py-3">{b.code}</td>
                      <td className="px-5 py-3">{b.city || b.address?.city || '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-3 text-right">
                        <Can permission="branches:edit">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await updateBranch({
                                  id: b._id,
                                  status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                }).unwrap()
                                toast.success('Updated')
                              } catch (err) {
                                toast.error(getErrorMessage(err))
                              }
                            }}
                          >
                            Toggle
                          </Button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
