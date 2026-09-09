import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useCreateTicketMutation, useGetTicketsQuery } from '../support/supportApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const schema = z.object({
  subject: z.string().min(4, 'Subject required'),
  description: z.string().min(8, 'Describe the issue'),
})

export function CustomerPortalSupport() {
  const toast = useToast()
  const { data, isLoading } = useGetTicketsQuery({ mine: true, limit: 50 })
  const [createTicket, { isLoading: creating }] = useCreateTicketMutation()
  const tickets = data?.data || []
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { subject: '', description: '' } })

  const onSubmit = async (values) => {
    try {
      await createTicket(values).unwrap()
      toast.success('Ticket submitted')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Support</h1>
      <Card>
        <CardHeader title="New ticket" />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <Input label="Subject" required error={errors.subject?.message} {...register('subject')} />
            <Textarea label="Description" required error={errors.description?.message} {...register('description')} />
            <Button type="submit" loading={creating}>
              Submit
            </Button>
          </form>
        </CardBody>
      </Card>
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-ink-500">Loading tickets…</p>
        ) : (
          tickets.map((t) => (
            <Link
              key={t._id}
              to={`/portal/support/${t._id}`}
              className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3"
            >
              <span className="font-medium text-ink-900">{t.subject}</span>
              <StatusBadge status={t.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
