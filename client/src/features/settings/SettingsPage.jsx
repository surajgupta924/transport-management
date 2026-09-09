import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGetSettingsQuery, useUpdateSettingsMutation } from './settingsApi'
import { useUploadFilesMutation } from '../uploads/uploadsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, mediaUrl } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  tagline: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().optional(),
  gstin: z.string().optional(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
  invoicePrefix: z.string().optional(),
  bookingPrefix: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
})

function toMap(settings) {
  if (Array.isArray(settings)) return Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return settings || {}
}

export function SettingsPage() {
  const toast = useToast()
  const { data, isLoading } = useGetSettingsQuery()
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation()
  const [uploadFiles, { isLoading: uploading }] = useUploadFilesMutation()
  const [logoPreview, setLogoPreview] = useState('')
  const [faviconPreview, setFaviconPreview] = useState('')
  const settings = data?.data || []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: 'SwiftHaul',
      tagline: 'Transport Management ERP',
      supportEmail: '',
      supportPhone: '',
      gstin: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      invoicePrefix: 'INV',
      bookingPrefix: 'BK',
      logoUrl: '',
      faviconUrl: '',
    },
  })

  const logoUrl = watch('logoUrl')
  const faviconUrl = watch('faviconUrl')

  useEffect(() => {
    const map = toMap(settings)
    if (!map || Object.keys(map).length === 0) return
    reset({
      companyName: map['company.name'] || 'SwiftHaul',
      tagline: map['company.tagline'] || 'Transport Management ERP',
      supportEmail: map['company.supportEmail'] || '',
      supportPhone: map['company.supportPhone'] || '',
      gstin: map['company.gstin'] || '',
      currency: map['company.currency'] || 'INR',
      timezone: map['company.timezone'] || 'Asia/Kolkata',
      invoicePrefix: map['invoice.prefix'] || 'INV',
      bookingPrefix: map['booking.prefix'] || 'BK',
      logoUrl: map['company.logoUrl'] || '',
      faviconUrl: map['company.faviconUrl'] || '',
    })
    setLogoPreview(mediaUrl(map['company.logoUrl']))
    setFaviconPreview(mediaUrl(map['company.faviconUrl']))
  }, [settings, reset])

  const uploadAsset = async (file, folderKey) => {
    if (!file) return
    const res = await uploadFiles({ files: [file], folder: 'branding' }).unwrap()
    const url = res.data?.[0]?.url
    if (!url) throw new Error('Upload did not return a URL')
    setValue(folderKey, url, { shouldDirty: true })
    if (folderKey === 'logoUrl') setLogoPreview(mediaUrl(url))
    if (folderKey === 'faviconUrl') setFaviconPreview(mediaUrl(url))
    return url
  }

  const onSubmit = async (values) => {
    try {
      await updateSettings({
        settings: [
          { key: 'company.name', value: values.companyName, group: 'company' },
          { key: 'company.tagline', value: values.tagline || '', group: 'company' },
          { key: 'company.supportEmail', value: values.supportEmail || '', group: 'company' },
          { key: 'company.supportPhone', value: values.supportPhone || '', group: 'company' },
          { key: 'company.gstin', value: values.gstin || '', group: 'company' },
          { key: 'company.currency', value: values.currency, group: 'company' },
          { key: 'company.timezone', value: values.timezone, group: 'company' },
          { key: 'company.logoUrl', value: values.logoUrl || '', group: 'company' },
          { key: 'company.faviconUrl', value: values.faviconUrl || '', group: 'company' },
          { key: 'invoice.prefix', value: values.invoicePrefix || 'INV', group: 'invoices' },
          { key: 'booking.prefix', value: values.bookingPrefix || 'BK', group: 'bookings' },
        ],
      }).unwrap()
      toast.success('Settings saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" description="Company branding, logo, favicon, and system prefixes" />
      <Card>
        <CardHeader title="Branding" />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2" noValidate>
            <Input label="Company name" required error={errors.companyName?.message} {...register('companyName')} />
            <Input label="Tagline" {...register('tagline')} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Dashboard logo</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800"
                onChange={async (e) => {
                  try {
                    await uploadAsset(e.target.files?.[0], 'logoUrl')
                    toast.success('Logo uploaded')
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                }}
              />
              {(logoPreview || logoUrl) && (
                <img src={logoPreview || mediaUrl(logoUrl)} alt="Logo preview" className="h-12 max-w-[180px] object-contain" />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Favicon</label>
              <input
                type="file"
                accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800"
                onChange={async (e) => {
                  try {
                    await uploadAsset(e.target.files?.[0], 'faviconUrl')
                    toast.success('Favicon uploaded')
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                }}
              />
              {(faviconPreview || faviconUrl) && (
                <img src={faviconPreview || mediaUrl(faviconUrl)} alt="Favicon preview" className="h-8 w-8 object-contain" />
              )}
            </div>
            <Input label="GSTIN" {...register('gstin')} />
            <Input label="Support email" type="email" {...register('supportEmail')} />
            <Input label="Support phone" {...register('supportPhone')} />
            <Input label="Currency" {...register('currency')} />
            <Input label="Timezone" {...register('timezone')} />
            <Input label="Invoice prefix" {...register('invoicePrefix')} />
            <Input label="Booking prefix" {...register('bookingPrefix')} />
            <Can permission="settings:manage">
              <div className="md:col-span-2">
                <Button type="submit" loading={saving || uploading}>
                  Save settings
                </Button>
              </div>
            </Can>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
