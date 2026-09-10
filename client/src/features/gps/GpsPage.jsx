import { useEffect, useState } from 'react'
import { Copy, SatelliteDish } from 'lucide-react'
import { useGenerateGpsTokenMutation, useGetGpsSetupQuery, useSaveGpsSetupMutation } from './gpsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

export function GpsPage() {
  const toast = useToast()
  const { data, isLoading } = useGetGpsSetupQuery()
  const setup = data?.data || {}
  const [form, setForm] = useState({ provider: 'GENERIC', mobileFallbackDelay: 90, truckGpsEnabled: false })
  const [saveSetup, { isLoading: saving }] = useSaveGpsSetupMutation()
  const [generateToken, { isLoading: generating }] = useGenerateGpsTokenMutation()

  useEffect(() => {
    if (setup.provider) {
      setForm({
        provider: setup.provider || 'GENERIC',
        mobileFallbackDelay: setup.mobileFallbackDelay ?? 90,
        truckGpsEnabled: Boolean(setup.truckGpsEnabled),
      })
    }
  }, [setup.provider, setup.mobileFallbackDelay, setup.truckGpsEnabled])

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '')
  const webhookUrl = `${apiBase || window.location.origin}${setup.webhookPath || '/api/v1/gps/webhook'}`

  const onSave = async () => {
    try {
      await saveSetup(form).unwrap()
      toast.success('GPS setup saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onToken = async () => {
    try {
      await generateToken().unwrap()
      toast.success('Webhook token generated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="FLEET SETUP"
        title="GPS Integration"
        description="A one-time provider connection for all GPS-enabled trucks in the organisation."
      />
      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <SatelliteDish className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-ink-900">GPS Provider Connection</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${setup.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {setup.connected ? 'Connected' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-ink-500">This setup for demo only needs to be completed once. Each vehicle will be identified by its unique GPS Device ID/IMEI.</p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-ink-400">Loading GPS settings…</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="GPS Provider" value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))} hint="The GPS service or company name." />
                <Input
                  label="Mobile fallback delay"
                  type="number"
                  value={form.mobileFallbackDelay}
                  onChange={(e) => setForm((s) => ({ ...s, mobileFallbackDelay: Number(e.target.value) }))}
                  hint="The mobile device will be used when truck GPS data becomes stale."
                />
              </div>
              <Input label="Provider webhook URL" readOnly value={webhookUrl} />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50/70 p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
                  <input
                    type="checkbox"
                    checked={form.truckGpsEnabled}
                    onChange={(e) => setForm((s) => ({ ...s, truckGpsEnabled: e.target.checked }))}
                  />
                  Enable truck GPS integration
                </label>
                <p className="text-xs text-ink-500">Driver mobile tracking will run when this is OFF.</p>
              </div>
              {setup.webhookToken && (
                <p className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-ink-600">X-GPS-Token: {setup.webhookToken}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                  <Copy className="h-4 w-4" /> Copy URL
                </Button>
                <Button variant="secondary" loading={generating} onClick={onToken}>Generate Token</Button>
                <Button loading={saving} onClick={onSave}>Save GPS Setup</Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-4 font-display font-semibold">How are multiple vehicles connected?</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Each truck', 'Save a unique Device ID/IMEI in the vehicle form.'],
              ['Same provider setup', 'All trucks will use the same webhook and organisation token.'],
              ['Automatic fallback', "The assigned driver's mobile device will be used if truck data is unavailable."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-ink-100 bg-slate-50 p-4">
                <p className="font-medium text-ink-900">{title}</p>
                <p className="mt-1 text-sm text-ink-500">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-500">
            The provider request must include the <b>X-GPS-Token</b> header and the <b>device_id, latitude, longitude, speed, timestamp</b> fields. For reliable retries, resend the same <b>event_id</b> as <b>X-Idempotency-Key</b>.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
