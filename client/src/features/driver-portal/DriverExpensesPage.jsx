import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Wallet } from 'lucide-react'
import { useCreateExpenseMutation, useGetExpensesQuery } from '../expenses/expensesApi'
import { useUploadFilesMutation } from '../uploads/uploadsApi'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, formatMoney, mediaUrl } from '../../lib/utils'

const schema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  tripId: z.string().optional(),
  description: z.string().min(2),
  receiptUrl: z.string().optional(),
})

export function DriverExpensesPage() {
  const toast = useToast()
  const { data, isLoading } = useGetExpensesQuery({ limit: 30, mine: true })
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation()
  const [uploadFiles, { isLoading: uploading }] = useUploadFilesMutation()
  const rows = data?.data || []
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: 'TOLL', amount: 0, tripId: '', description: '', receiptUrl: '' },
  })
  const receiptUrl = watch('receiptUrl')

  const onCreate = async (values) => {
    try {
      await createExpense({
        ...values,
        title: values.description,
        tripId: values.tripId || undefined,
        receiptUrl: values.receiptUrl || undefined,
      }).unwrap()
      toast.success('Expense submitted')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-ink-900">Expenses</h1>
      <Card>
        <CardHeader title="Log expense + receipt" />
        <CardBody>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-3" noValidate>
            <Select label="Category" {...register('category')}>
              <option value="FUEL">Fuel</option>
              <option value="TOLL">Toll</option>
              <option value="PARKING">Parking</option>
              <option value="FOOD">Food</option>
              <option value="REPAIR">Repair</option>
              <option value="OTHER">Other</option>
            </Select>
            <Input label="Amount" type="number" required error={errors.amount?.message} {...register('amount')} />
            <Input label="Trip ID (optional)" {...register('tripId')} />
            <Textarea label="Description" required error={errors.description?.message} {...register('description')} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Receipt photo or PDF</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const res = await uploadFiles({ files: [file], folder: 'receipts' }).unwrap()
                    const url = res.data?.[0]?.url
                    if (url) {
                      setValue('receiptUrl', url)
                      toast.success('Receipt uploaded')
                    }
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                }}
              />
              {receiptUrl && (
                <a href={mediaUrl(receiptUrl)} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700">
                  View receipt
                </a>
              )}
            </div>
            <Button type="submit" className="w-full" loading={creating || uploading}>
              Submit expense
            </Button>
          </form>
        </CardBody>
      </Card>
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No expenses" description="Toll, food, parking, and fuel go here." />
      ) : (
        rows.map((r) => (
          <div key={r._id} className="flex items-center justify-between rounded-xl border border-ink-200 bg-white p-4">
            <div>
              <p className="font-medium text-ink-900">{r.title || r.description}</p>
              <p className="text-sm text-ink-500">{formatMoney(r.amount)}</p>
              {r.receiptUrl && (
                <a href={mediaUrl(r.receiptUrl)} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700">
                  View receipt
                </a>
              )}
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))
      )}
    </div>
  )
}
