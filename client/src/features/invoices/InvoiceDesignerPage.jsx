import { useEffect, useState } from 'react'
import { useGetInvoiceDesignerQuery, useSaveInvoiceDesignerMutation } from '../invoices/invoicesApi'
import { useGetPublicSettingsQuery } from '../settings/settingsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const TOGGLES = [
  ['showLogo', 'Organization logo'],
  ['showAddress', 'Organization address'],
  ['showContact', 'Organization contact'],
  ['showGst', 'GST & PAN'],
  ['showCustomerId', 'Customer ID'],
  ['showTracking', 'Tracking / LR number'],
  ['showBookingDate', 'Booking date'],
  ['showDueDate', 'Due date'],
]

export function InvoiceDesignerPage() {
  const toast = useToast()
  const { data } = useGetInvoiceDesignerQuery()
  const { data: brand } = useGetPublicSettingsQuery()
  const [save, { isLoading }] = useSaveInvoiceDesignerMutation()
  const [form, setForm] = useState(null)
  const setup = data?.data
  const company = brand?.data || {}

  useEffect(() => {
    if (setup) setForm(setup)
  }, [setup])

  if (!form) return <p className="p-6 text-sm text-ink-500">Loading designer…</p>

  const onSave = async (published) => {
    try {
      await save({ ...form, published: published ?? form.published }).unwrap()
      toast.success(published ? 'Invoice template published' : 'Draft saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader title="Invoice Designer" description="Choose the name, layout, and brand colors." />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Published version<br /><b>{form.published ? 'Live' : 'Not published yet'}</b></div>
        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">Draft status<br /><b>Unpublished changes</b></div>
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Invoice safety<br /><b>Old invoices stay unchanged</b></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-4">
            <Input label="Template name" value={form.templateName} onChange={(e) => setForm((s) => ({ ...s, templateName: e.target.value }))} />
            <div className="grid grid-cols-3 gap-2">
              {['modern', 'classic', 'compact'].map((style) => (
                <button key={style} type="button" onClick={() => setForm((s) => ({ ...s, style }))} className={`rounded-xl border p-3 text-sm capitalize ${form.style === style ? 'border-blue-600 bg-blue-50' : 'border-ink-200'}`}>{style}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Primary color" value={form.primaryColor} onChange={(e) => setForm((s) => ({ ...s, primaryColor: e.target.value }))} />
              <Input label="Header color" value={form.headerColor} onChange={(e) => setForm((s) => ({ ...s, headerColor: e.target.value }))} />
              <Select label="Font" value={form.font} onChange={(e) => setForm((s) => ({ ...s, font: e.target.value }))}>
                <option>Inter</option>
                <option>IBM Plex Sans</option>
                <option>Georgia</option>
              </Select>
              <Select label="Header" value={form.headerAlign} onChange={(e) => setForm((s) => ({ ...s, headerAlign: e.target.value }))}>
                <option value="left">Left</option>
                <option value="center">Center</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TOGGLES.map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  {label}
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.checked }))} />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" loading={isLoading} onClick={() => onSave(false)}>Save draft</Button>
              <Button loading={isLoading} onClick={() => onSave(true)}>Publish</Button>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-ink-500">Live Preview</p>
            <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm" style={{ fontFamily: form.font }}>
              <div className="flex items-center justify-between px-6 py-4 text-white" style={{ background: form.headerColor, textAlign: form.headerAlign }}>
                <div>
                  {form.showLogo && <p className="text-lg font-semibold">{company.companyName || 'Company'}</p>}
                  {form.showAddress && <p className="text-xs opacity-80">Head Office, India</p>}
                </div>
                <div className="text-right text-xs">
                  <p>TAX INVOICE</p>
                  <p>INV-PREVIEW</p>
                </div>
              </div>
              <div className="px-6 py-4 text-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-ink-400">BILL TO</p>
                    <p className="font-medium">Sample Customer Pvt. Ltd.</p>
                    {form.showGst && <p className="text-xs">GSTIN: 27AAPCA1234A1Z5</p>}
                  </div>
                  <div className="text-right text-xs text-ink-500">
                    {form.showTracking && <p>LR: LR-2026-0001</p>}
                    {form.showBookingDate && <p>Booking: 09 Sep 2026</p>}
                    {form.showDueDate && <p>Due: 24 Sep 2026</p>}
                  </div>
                </div>
                <table className="mt-4 w-full text-xs">
                  <thead><tr className="bg-slate-50"><th className="p-2 text-left">Description</th><th className="p-2">Qty</th><th className="p-2 text-right">Amount</th></tr></thead>
                  <tbody>
                    <tr><td className="p-2">Freight</td><td className="p-2 text-center">1</td><td className="p-2 text-right">₹12,000</td></tr>
                    <tr><td className="p-2">Loading</td><td className="p-2 text-center">1</td><td className="p-2 text-right">₹800</td></tr>
                  </tbody>
                </table>
                <div className="mt-4 flex justify-end">
                  <div className="rounded-lg px-4 py-2 text-white" style={{ background: form.primaryColor }}>
                    Total ₹15,104
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
