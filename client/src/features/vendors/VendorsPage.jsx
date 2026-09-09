import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useCreateVendorMutation, useGetVendorsQuery } from './vendorsApi'
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
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  category: z.string().optional(),
  gstin: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export function VendorsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, isFetching } = useGetVendorsQuery(queryArgs)
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', mobile: '', email: '', category: 'WORKSHOP', gstin: '', status: 'ACTIVE' },
  })

  const onCreate = async (values) => {
    try {
      await createVendor({ ...values, email: values.email || undefined }).unwrap()
      toast.success('Vendor created')
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Vendors"
        description="Workshops, fuel pumps, and suppliers"
        action={
          <Can permission="vendors:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'Add vendor'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="New vendor" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Name" required error={errors.name?.message} {...register('name')} />
              <Input label="Mobile" {...register('mobile')} />
              <Input label="Email" type="email" {...register('email')} />
              <Select label="Category" {...register('category')}>
                <option value="WORKSHOP">Workshop</option>
                <option value="FUEL">Fuel</option>
                <option value="TYRE">Tyre</option>
                <option value="OTHER">Other</option>
              </Select>
              <Input label="GSTIN" {...register('gstin')} />
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
        <CardHeader title="Vendor list" action={<Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-48" />} />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="No vendors" description="Add vendors for maintenance and fuel." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Mobile</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((v) => (
                    <tr key={v._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium">{v.name}</td>
                      <td className="px-5 py-3">{v.category}</td>
                      <td className="px-5 py-3">{v.mobile || '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={v.status} /></td>
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
