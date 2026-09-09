import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAddCustomerNoteMutation,
  useGetCustomerQuery,
  useUpdateCustomerTagsMutation,
} from './customersApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const noteSchema = z.object({ body: z.string().min(2, 'Note required') })
const tagsSchema = z.object({ tags: z.string() })

export function CustomerDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const { data, isLoading } = useGetCustomerQuery(id)
  const [addNote, { isLoading: addingNote }] = useAddCustomerNoteMutation()
  const [updateTags, { isLoading: savingTags }] = useUpdateCustomerTagsMutation()
  const customer = data?.data

  const noteForm = useForm({ resolver: zodResolver(noteSchema), defaultValues: { body: '' } })
  const tagsForm = useForm({
    resolver: zodResolver(tagsSchema),
    defaultValues: { tags: '' },
  })

  useEffect(() => {
    if (customer?.tags) {
      tagsForm.reset({ tags: (customer.tags || []).join(', ') })
    }
  }, [customer?.tags, tagsForm])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!customer) {
    return <p className="text-sm text-ink-500">Customer not found.</p>
  }

  const onAddNote = async (values) => {
    try {
      await addNote({ id, body: values.body }).unwrap()
      toast.success('Note added')
      noteForm.reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onSaveTags = async (values) => {
    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      await updateTags({ id, tags }).unwrap()
      toast.success('Tags updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes' },
    { id: 'tags', label: 'Tags' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title={customer.name}
        description={customer.company || customer.email || customer.mobile}
        action={
          <div className="flex gap-2">
            <Link to="/app/customers">
              <Button variant="secondary">Back</Button>
            </Link>
            <Can permission="customers:edit">
              <Link to={`/app/customers/${id}/edit`}>
                <Button>Edit</Button>
              </Link>
            </Can>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={customer.status} />
        <StatusBadge status={customer.source} />
        <Badge>{customer.type}</Badge>
      </div>

      <div className="flex gap-1 border-b border-ink-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-b-2 border-brand-500 text-ink-900' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader title="Contact" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Mobile" value={customer.mobile} />
              <Row label="Email" value={customer.email} />
              <Row label="GSTIN" value={customer.gstin} />
              <Row label="Credit limit" value={customer.creditLimit} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Address" />
            <CardBody className="text-sm text-ink-700">
              <p>{customer.address?.line1 || '—'}</p>
              {customer.address?.line2 && <p>{customer.address.line2}</p>}
              <p>
                {[customer.address?.city, customer.address?.state, customer.address?.pincode]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <Card>
          <CardHeader title="Notes & follow-ups" />
          <CardBody className="space-y-4">
            <Can permission="customers:edit">
              <form onSubmit={noteForm.handleSubmit(onAddNote)} className="space-y-3">
                <Textarea label="Add note" error={noteForm.formState.errors.body?.message} {...noteForm.register('body')} />
                <Button type="submit" loading={addingNote} size="sm">
                  Add note
                </Button>
              </form>
            </Can>
            <div className="space-y-3">
              {(customer.notesList || customer.followUps || []).length === 0 ? (
                <p className="text-sm text-ink-500">No notes yet.</p>
              ) : (
                (customer.notesList || customer.followUps || []).map((n, i) => (
                  <div key={n._id || i} className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-sm">
                    <p className="text-ink-800">{n.body || n.note || n}</p>
                    {n.createdAt && (
                      <p className="mt-1 text-xs text-ink-400">{new Date(n.createdAt).toLocaleString()}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'tags' && (
        <Card>
          <CardHeader title="Tags" description="Comma-separated labels for CRM segments" />
          <CardBody>
            <form onSubmit={tagsForm.handleSubmit(onSaveTags)} className="space-y-3">
              <Input label="Tags" {...tagsForm.register('tags')} hint="e.g. VIP, corporate, cash" />
              <div className="flex flex-wrap gap-1.5">
                {(customer.tags || []).map((tag) => (
                  <Badge key={tag} tone="brand">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Can permission="customers:edit">
                <Button type="submit" loading={savingTags} size="sm">
                  Save tags
                </Button>
              </Can>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 pb-2 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value || '—'}</span>
    </div>
  )
}
