import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useExportReportMutation, useGetReportQuery } from './reportsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

export function ReportsPage() {
  const toast = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const fromDefault = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [from, setFrom] = useState(fromDefault)
  const [to, setTo] = useState(today)
  const params = useMemo(() => ({ type: 'business', from, to }), [from, to])
  const { data, isFetching, refetch } = useGetReportQuery(params)
  const [exportReport, { isLoading: exporting }] = useExportReportMutation()
  const report = data?.data || {}
  const totals = report.totals || {}
  const statusRows = report.status || []
  const totalStatus = statusRows.reduce((s, r) => s + r.count, 0) || 1

  const onExport = async () => {
    try {
      const result = await exportReport({ type: 'operations', from, to }).unwrap()
      if (result?.blob instanceof Blob) {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'business-report.csv'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Download started')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Export failed'))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Business Reports"
        description="Analyze shipment operations, delivery performance, and billing collections in one consolidated view."
        action={<Can permission="reports:export"><Button onClick={onExport} loading={exporting}><Download className="h-4 w-4" /> Print Report</Button></Can>}
      />
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Input label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={() => refetch()}>Apply Range</Button>
        </CardBody>
      </Card>
      <div className={`grid gap-3 sm:grid-cols-4 ${isFetching ? 'opacity-60' : ''}`}>
        <StatCard label="Total shipments" value={totals.totalShipments || 0} />
        <StatCard label="Delivered" value={totals.delivered || 0} tone="green" />
        <StatCard label="In transit" value={totals.inTransit || 0} tone="blue" />
        <StatCard label="Total weight" value={`${totals.totalWeight || 0} kg`} tone="violet" />
        <StatCard label="Invoiced" value={formatMoney(totals.invoiced)} />
        <StatCard label="Collected" value={formatMoney(totals.collected)} tone="green" />
        <StatCard label="Outstanding" value={formatMoney(totals.outstanding)} tone="rose" />
        <StatCard label="Active" value={totals.active || 0} tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold">Shipment Status</h3>
            <div className="space-y-3">
              {statusRows.map((row) => (
                <div key={row._id}>
                  <div className="mb-1 flex justify-between text-sm"><span>{row._id}</span><span>{row.count}</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(row.count / totalStatus) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold">Top Routes</h3>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-ink-400"><tr><th className="py-2 text-left">Route</th><th>Shipments</th><th>Delivered</th><th>Rate</th></tr></thead>
              <tbody>
                {(report.topRoutes || []).map((r) => (
                  <tr key={`${r.from}-${r.to}`} className="border-t border-ink-50">
                    <td className="py-2">{r.from} → {r.to}</td>
                    <td className="text-center">{r.shipments}</td>
                    <td className="text-center">{r.delivered}</td>
                    <td className="text-center text-emerald-700">{r.deliveryRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
