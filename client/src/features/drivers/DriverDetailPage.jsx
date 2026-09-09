import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAddDriverDocumentMutation, useDeleteDriverDocumentMutation, useGetDriverQuery } from './driversApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const docSchema = z.object({
  type: z.string().min(1),
  number: z.string().optional(),
  expiryDate: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
})

export function DriverDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isLoading } = useGetDriverQuery(id)
  const [addDoc, { isLoading: adding }] = useAddDriverDocumentMutation()
  const [deleteDoc] = useDeleteDriverDocumentMutation()
  const [showDoc, setShowDoc] = useState(false)
  const driver = data?.data
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(docSchema),
    defaultValues: { type: 'LICENSE', number: '', expiryDate: '', fileUrl: '' },
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!driver) return <p className="text-sm text-ink-500">Driver not found.</p>

  const onAddDoc = async (values) => {
    try {
      await addDoc({ id, ...values, fileUrl: values.fileUrl || undefined }).unwrap()
      toast.success('Document added')
      reset()
      setShowDoc(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={driver.name}
        description={driver.mobile}
        action={
          <div className="flex gap-2">
            <Link to="/app/drivers"><Button variant="secondary">Back</Button></Link>
            <Can permission="drivers:edit">
              <Link to={`/app/drivers/${id}/edit`}><Button>Edit</Button></Link>
            </Can>
          </div>
        }
      />
      <StatusBadge status={driver.status} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="License & employment" />
          <CardBody className="space-y-2 text-sm">
            <Row label="License" value={driver.licenseNumber} />
            <Row label="Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : null} />
            <Row label="Employee ID" value={driver.employeeId} />
            <Row label="Salary" value={driver.salary} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Documents"
            action={
              <Can permission="drivers:edit">
                <Button size="sm" variant="secondary" onClick={() => setShowDoc((v) => !v)}>
                  {showDoc ? 'Close' : 'Add document'}
                </Button>
              </Can>
            }
          />
          <CardBody className="space-y-3">
            {showDoc && (
              <form onSubmit={handleSubmit(onAddDoc)} className="grid gap-3 rounded-lg border border-ink-100 p-3 md:grid-cols-2">
                <Select label="Type" {...register('type')}>
                  <option value="LICENSE">License</option>
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="MEDICAL">Medical</option>
                </Select>
                <Input label="Number" {...register('number')} />
                <Input label="Expiry" type="date" {...register('expiryDate')} />
                <Input label="File URL" error={errors.fileUrl?.message} {...register('fileUrl')} />
                <div className="md:col-span-2">
                  <Button type="submit" size="sm" loading={adding}>Save document</Button>
                </div>
              </form>
            )}
            {(driver.documents || []).length === 0 ? (
              <p className="text-sm text-ink-500">No documents.</p>
            ) : (
              <ul className="space-y-2">
                {(driver.documents || []).map((d) => (
                  <li key={d._id} className="flex items-center justify-between rounded-md border border-ink-100 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{d.type}</p>
                      <p className="text-xs text-ink-500">{d.number || '—'}</p>
                    </div>
                    <Can permission="drivers:edit">
                      <Button size="sm" variant="ghost" onClick={async () => {
                        try { await deleteDoc({ id, docId: d._id }).unwrap(); toast.success('Removed') }
                        catch (err) { toast.error(getErrorMessage(err)) }
                      }}>Remove</Button>
                    </Can>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
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
