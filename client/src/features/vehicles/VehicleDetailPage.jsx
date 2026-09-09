import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAddVehicleDocumentMutation,
  useDeleteVehicleDocumentMutation,
  useGetVehicleQuery,
} from './vehiclesApi'
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

export function VehicleDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isLoading } = useGetVehicleQuery(id)
  const [addDoc, { isLoading: adding }] = useAddVehicleDocumentMutation()
  const [deleteDoc] = useDeleteVehicleDocumentMutation()
  const [showDoc, setShowDoc] = useState(false)
  const vehicle = data?.data

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(docSchema),
    defaultValues: { type: 'RC', number: '', expiryDate: '', fileUrl: '' },
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!vehicle) return <p className="text-sm text-ink-500">Vehicle not found.</p>

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
        title={vehicle.registrationNumber || vehicle.regNo}
        description={[vehicle.make, vehicle.model, vehicle.type].filter(Boolean).join(' · ')}
        action={
          <div className="flex gap-2">
            <Link to="/app/vehicles">
              <Button variant="secondary">Back</Button>
            </Link>
            <Can permission="vehicles:edit">
              <Link to={`/app/vehicles/${id}/edit`}>
                <Button>Edit</Button>
              </Link>
            </Can>
          </div>
        }
      />
      <StatusBadge status={vehicle.status} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Specs" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Capacity" value={vehicle.capacityKg ? `${vehicle.capacityKg} kg` : null} />
            <Row label="Current KM" value={vehicle.currentKm} />
            <Row label="Fuel" value={vehicle.fuelType} />
            <Row label="Chassis" value={vehicle.chassisNumber} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Documents"
            action={
              <Can permission="vehicles:edit">
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
                  <option value="RC">RC</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="PERMIT">Permit</option>
                  <option value="FITNESS">Fitness</option>
                  <option value="PUC">PUC</option>
                </Select>
                <Input label="Number" {...register('number')} />
                <Input label="Expiry" type="date" {...register('expiryDate')} />
                <Input label="File URL" error={errors.fileUrl?.message} {...register('fileUrl')} />
                <div className="md:col-span-2">
                  <Button type="submit" size="sm" loading={adding}>
                    Save document
                  </Button>
                </div>
              </form>
            )}
            {(vehicle.documents || []).length === 0 ? (
              <p className="text-sm text-ink-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {(vehicle.documents || []).map((d) => (
                  <li key={d._id} className="flex items-center justify-between rounded-md border border-ink-100 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-ink-900">{d.type}</p>
                      <p className="text-xs text-ink-500">
                        {d.number || '—'} · Exp {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <Can permission="vehicles:edit">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await deleteDoc({ id, docId: d._id }).unwrap()
                            toast.success('Removed')
                          } catch (err) {
                            toast.error(getErrorMessage(err))
                          }
                        }}
                      >
                        Remove
                      </Button>
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
