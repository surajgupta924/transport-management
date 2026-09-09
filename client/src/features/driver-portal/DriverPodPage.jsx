import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileCheck2 } from 'lucide-react'
import { useCreatePodMutation, useGetPodsQuery } from '../pod/podApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const schema = z.object({
  tripId: z.string().min(1, 'Trip ID required'),
  receivedBy: z.string().min(2),
  remarks: z.string().optional(),
  photoUrl: z.string().optional(),
})

export function DriverPodPage() {
  const toast = useToast()
  const [params] = useSearchParams()
  const { data, isLoading } = useGetPodsQuery({ limit: 30 })
  const [createPod, { isLoading: creating }] = useCreatePodMutation()
  const rows = data?.data || []
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tripId: params.get('tripId') || '',
      receivedBy: '',
      remarks: '',
      photoUrl: '',
    },
  })

  const onCreate = async (values) => {
    try {
      await createPod({
        tripId: values.tripId,
        receivedBy: values.receivedBy,
        remarks: values.remarks,
        photoUrl: values.photoUrl || undefined,
      }).unwrap()
      toast.success('POD submitted')
      reset({ tripId: '', receivedBy: '', remarks: '', photoUrl: '' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-ink-900">Proof of delivery</h1>
      <Card>
        <CardHeader title="Submit POD" />
        <CardBody>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-3" noValidate>
            <Input label="Trip ID" required error={errors.tripId?.message} {...register('tripId')} />
            <Input label="Received by" required error={errors.receivedBy?.message} {...register('receivedBy')} />
            <Input label="Photo URL (optional)" {...register('photoUrl')} />
            <Textarea label="Remarks" {...register('remarks')} />
            <Button type="submit" className="w-full" loading={creating}>
              Submit POD
            </Button>
          </form>
        </CardBody>
      </Card>
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No POD yet" description="Submit when cargo is delivered." />
      ) : (
        rows.map((r) => (
          <div key={r._id} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.trip?.tripNumber || 'Trip'}</p>
                <p className="text-sm text-ink-500">{r.receiverName || r.receivedBy}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
