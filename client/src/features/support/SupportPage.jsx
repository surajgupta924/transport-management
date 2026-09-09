import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { LifeBuoy, Plus } from 'lucide-react'
import { useCreateTicketMutation, useGetTicketsQuery } from './supportApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  subject: z.string().min(3),
  category: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().min(5),
})

export function SupportPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const queryArgs = useMemo(
    () => ({ page, limit: 10, search: search || undefined, status: status || undefined }),
    [page, search, status]
  )
  const { data, isLoading, isFetching } = useGetTicketsQuery(queryArgs)
  const [createTicket, { isLoading: creating }] = useCreateTicketMutation()
  const rows = data?.data || []
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', category: 'GENERAL', priority: 'MEDIUM', description: '' },
  })

  const onCreate = async (values) => {
    try {
      const res = await createTicket(values).unwrap()
      toast.success('Ticket created')
      reset()
      setShowForm(false)
      return res
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Support tickets"
        description="Customer and internal support queue"
        action={
          <Can permission="support:create">
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              {showForm ? 'Close' : 'New ticket'}
            </Button>
          </Can>
        }
      />
      {showForm && (
        <Card>
          <CardHeader title="Create ticket" />
          <CardBody>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 md:grid-cols-2" noValidate>
              <Input label="Subject" required className="md:col-span-2" error={errors.subject?.message} {...register('subject')} />
              <Select label="Category" {...register('category')}>
                <option value="GENERAL">General</option>
                <option value="BOOKING">Booking</option>
                <option value="BILLING">Billing</option>
                <option value="TRACKING">Tracking</option>
              </Select>
              <Select label="Priority" {...register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
              <Textarea label="Description" className="md:col-span-2" required error={errors.description?.message} {...register('description')} />
              <div className="md:col-span-2">
                <Button type="submit" loading={creating}>Submit ticket</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          title="Queue"
          action={
            <div className="flex gap-2">
              <Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-44" />
              <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="w-36">
                <option value="">All status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets" description="Create a support ticket to track issues." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Subject</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((t) => (
                    <tr key={t._id} className="border-b border-ink-50">
                      <td className="px-5 py-3 font-medium text-ink-900">{t.subject}</td>
                      <td className="px-5 py-3"><StatusBadge status={t.priority} /></td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/app/support/${t._id}`} className="font-medium text-brand-700 hover:underline">Open</Link>
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
