import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAddTicketReplyMutation, useGetTicketQuery, useUpdateTicketMutation } from './supportApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const replySchema = z.object({ body: z.string().min(2) })

export function SupportDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isLoading } = useGetTicketQuery(id)
  const [addReply, { isLoading: replying }] = useAddTicketReplyMutation()
  const [updateTicket, { isLoading: updating }] = useUpdateTicketMutation()
  const ticket = data?.data
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(replySchema),
    defaultValues: { body: '' },
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!ticket) return <p className="text-sm text-ink-500">Ticket not found.</p>

  const onReply = async (values) => {
    try {
      await addReply({ id, body: values.body }).unwrap()
      toast.success('Reply added')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={ticket.subject}
        description={ticket.category}
        action={
          <Link to="/app/support">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={ticket.status} />
        <StatusBadge status={ticket.priority} />
        <Can permission="support:manage">
          <Select
            className="w-40"
            value={ticket.status}
            onChange={async (e) => {
              try {
                await updateTicket({ id, status: e.target.value }).unwrap()
                toast.success('Status updated')
              } catch (err) {
                toast.error(getErrorMessage(err))
              }
            }}
            disabled={updating}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </Can>
      </div>

      <Card>
        <CardHeader title="Description" />
        <CardBody className="text-sm text-ink-700 whitespace-pre-wrap">{ticket.description}</CardBody>
      </Card>

      <Card>
        <CardHeader title="Conversation" />
        <CardBody className="space-y-4">
          {(ticket.replies || ticket.messages || []).length === 0 ? (
            <p className="text-sm text-ink-500">No replies yet.</p>
          ) : (
            (ticket.replies || ticket.messages || []).map((r, i) => (
              <div key={r._id || i} className="rounded-lg border border-ink-100 bg-ink-50/50 p-3 text-sm">
                <p>{r.body || r.message}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {r.author?.name || 'User'} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                </p>
              </div>
            ))
          )}
          <form onSubmit={handleSubmit(onReply)} className="space-y-3">
            <Textarea label="Reply" error={errors.body?.message} {...register('body')} />
            <Button type="submit" size="sm" loading={replying}>
              Send reply
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
