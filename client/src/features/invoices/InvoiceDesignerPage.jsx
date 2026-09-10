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

const DEFAULT_FORM = {
  templateName: 'Default Invoice',
  style: 'modern',
  primaryColor: '#044dab',
  headerColor: '#031958',
  font: 'Inter',
  headerAlign: 'left',
  logoSize: 'medium',
  showLogo: true,
  showAddress: true,
  showContact: true,
  showGst: true,
  showCustomerId: true,
  showTracking: true,
  showBookingDate: true,
  showDueDate: true,
  showPaymentStatus: true,
  showBankDetails: true,
  showPaymentTerms: true,
  showNotes: true,
  published: false,
}

const TOGGLES = [
  ['showLogo', 'Organization logo'],
  ['showAddress', 'Organization address'],
  ['showContact', 'Organization contact'],
  ['showGst', 'GST & PAN'],
  ['showCustomerId', 'Customer ID'],
  ['showTracking', 'Tracking / LR number'],
  ['showBookingDate', 'Booking date'],
  ['showDueDate', 'Due date'],
  ['showPaymentStatus', 'Payment status'],
  ['showBankDetails', 'Bank details'],
  ['showPaymentTerms', 'Payment terms'],
  ['showNotes', 'Notes'],
]

const STYLES = [
  ['modern', 'Modern', 'Clean cards and a bold header'],
  ['classic', 'Classic', 'Traditional bordered invoice'],
  ['compact', 'Compact', 'More details in less space'],
]

function asBool(value, fallback = true) {
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value == null || value === '') return fallback
  return Boolean(value)
}

export function InvoiceDesignerPage() {
  const toast = useToast()
  const { data, isError } = useGetInvoiceDesignerQuery()
  const { data: brand } = useGetPublicSettingsQuery()
  const [save, { isLoading }] = useSaveInvoiceDesignerMutation()
  const [form, setForm] = useState(DEFAULT_FORM)
  const setup = data?.data
  const company = brand?.data || {}

  useEffect(() => {
    if (!setup) return
    const next = { ...DEFAULT_FORM, ...setup }
    for (const [key] of TOGGLES) next[key] = asBool(setup[key], DEFAULT_FORM[key])
    next.published = asBool(setup.published, false)
    setForm(next)
  }, [setup])

  const onSave = async (published) => {
    try {
      const saved = await save({ ...form, published: published ?? form.published }).unwrap()
      if (saved?.data) setForm({ ...DEFAULT_FORM, ...saved.data })
      toast.success(published ? 'Invoice template published' : 'Draft saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const logoSize = form.logoSize === 'small' ? 'text-base' : form.logoSize === 'large' ? 'text-2xl' : 'text-lg'
  const compact = form.style === 'compact'
  const classic = form.style === 'classic'

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader title="Invoice Designer" description="Choose the name, layout, and brand colors." />
      {isError && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">Designer settings could not be loaded from the server. You can still edit the preview and save.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <p className="text-sm font-semibold">Template & style</p>
              <Input label="Template name" value={form.templateName} onChange={(e) => setForm((s) => ({ ...s, templateName: e.target.value }))} />
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map(([style, label, hint]) => (
                  <button key={style} type="button" onClick={() => setForm((s) => ({ ...s, style }))} className={`rounded-xl border p-3 text-left ${form.style === style ? 'border-orange-400 bg-orange-50' : 'border-ink-200'}`}>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-[11px] text-ink-500">{hint}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-ink-700">
                  Primary color
                  <div className="mt-1 flex items-center gap-2">
                    <input type="color" value={form.primaryColor} onChange={(e) => setForm((s) => ({ ...s, primaryColor: e.target.value }))} className="h-10 w-12 cursor-pointer rounded border" />
                    <Input value={form.primaryColor} onChange={(e) => setForm((s) => ({ ...s, primaryColor: e.target.value }))} />
                  </div>
                </label>
                <label className="text-sm font-medium text-ink-700">
                  Header color
                  <div className="mt-1 flex items-center gap-2">
                    <input type="color" value={form.headerColor} onChange={(e) => setForm((s) => ({ ...s, headerColor: e.target.value }))} className="h-10 w-12 cursor-pointer rounded border" />
                    <Input value={form.headerColor} onChange={(e) => setForm((s) => ({ ...s, headerColor: e.target.value }))} />
                  </div>
                </label>
                <Select label="Font" value={form.font} onChange={(e) => setForm((s) => ({ ...s, font: e.target.value }))}>
                  <option>Inter</option>
                  <option>IBM Plex Sans</option>
                  <option>Georgia</option>
                </Select>
                <Select label="Header" value={form.headerAlign} onChange={(e) => setForm((s) => ({ ...s, headerAlign: e.target.value }))}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                </Select>
                <Select label="Logo size" value={form.logoSize} onChange={(e) => setForm((s) => ({ ...s, logoSize: e.target.value }))}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Select>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-semibold">Visible information</p>
              <div className="grid grid-cols-2 gap-2">
                {TOGGLES.map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    {label}
                    <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.checked }))} className="accent-orange-500" />
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" loading={isLoading} onClick={() => onSave(false)}>Save draft</Button>
                <Button loading={isLoading} onClick={() => onSave(true)}>Publish</Button>
              </div>
            </CardBody>
          </Card>
        </div>
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink-500">Live Preview</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">A4</span>
            </div>
            <div className={`overflow-hidden bg-white shadow-sm ${classic ? 'border-2 border-slate-800' : 'rounded-xl border border-ink-100'}`} style={{ fontFamily: form.font }}>
              <div className={`flex items-start justify-between px-6 py-4 text-white ${form.headerAlign === 'center' ? 'text-center' : ''}`} style={{ background: form.headerColor }}>
                <div>
                  {form.showLogo && <p className={`${logoSize} font-semibold`}>{company.companyName || 'demo'}</p>}
                  {form.showAddress && <p className="text-[11px] opacity-80">{[company.address, company.city, company.state].filter(Boolean).join(', ') || 'Head Office, India'}</p>}
                  {form.showContact && <p className="text-[11px] opacity-80">{[company.supportPhone, company.supportEmail].filter(Boolean).join(' · ')}</p>}
                  {form.showGst && <p className="text-[11px] opacity-80">GSTIN: {company.gstin || '09AAPCD1234A1Z5'} {company.pan ? `· PAN ${company.pan}` : ''}</p>}
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">TAX INVOICE</p>
                  <p>INV-PREVIEW</p>
                </div>
              </div>
              <div className={`px-6 py-4 text-sm ${compact ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-ink-400">BILL TO</p>
                    <p className="font-medium">Sample Customer Pvt. Ltd.</p>
                    {form.showCustomerId && <p className="text-xs">Customer ID: CUS-1008</p>}
                    {form.showGst && <p className="text-xs">GSTIN: 27AAPCA1234A1Z5</p>}
                  </div>
                  <div className="text-right text-xs text-ink-500">
                    {form.showTracking && <p>LR: LR-2026-0001</p>}
                    {form.showBookingDate && <p>Booking: 09 Sep 2026</p>}
                    {form.showDueDate && <p>Due: 24 Sep 2026</p>}
                    {form.showPaymentStatus && <p>Payment: Unpaid</p>}
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50"><th className="p-2 text-left">Description</th><th className="p-2">Qty</th><th className="p-2 text-right">Amount</th></tr></thead>
                  <tbody>
                    <tr><td className="p-2">Freight</td><td className="p-2 text-center">1</td><td className="p-2 text-right">₹12,000</td></tr>
                    <tr><td className="p-2">Loading</td><td className="p-2 text-center">1</td><td className="p-2 text-right">₹800</td></tr>
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="rounded-lg px-4 py-2 text-white" style={{ background: form.primaryColor }}>
                    Total ₹15,104
                  </div>
                </div>
                {form.showBankDetails && (
                  <div className="rounded-lg bg-slate-50 p-3 text-xs">
                    <p className="font-semibold">Bank / payment details</p>
                    <p>{company.bankName || 'HDFC Bank Ltd'}</p>
                    <p>A/C {company.bankAccount || '5010008888123'} · IFSC {company.ifsc || 'HDFC0001234'}</p>
                  </div>
                )}
                {form.showPaymentTerms && <p className="text-xs text-ink-500">Terms: {company.paymentTerms || 'Due on Receipt'}</p>}
                {form.showNotes && <p className="text-xs text-ink-400">Thank you for your business.</p>}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
