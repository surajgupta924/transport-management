import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useExportReportMutation, useGetReportQuery } from './reportsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { TableSkeleton, EmptyState } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const REPORT_TYPES = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'trips', label: 'Trips' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'fleet', label: 'Fleet utilization' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'customers', label: 'Customers' },
]

export function ReportsPage() {
  const toast = useToast()
  const [type, setType] = useState('bookings')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const params = useMemo(
    () => ({ type, from: from || undefined, to: to || undefined }),
    [type, from, to]
  )
  const { data, isLoading, isFetching } = useGetReportQuery(params)
  const [exportReport, { isLoading: exporting }] = useExportReportMutation()
  const rows = Array.isArray(data?.data) ? data.data : data?.data?.rows || []
  const columns = data?.data?.columns || (rows[0] ? Object.keys(rows[0]) : [])

  const onExport = async () => {
    try {
      const result = await exportReport(params).unwrap()
      if (result?.blob instanceof Blob) {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Download started')
        return
      }
      if (result?.data) {
        const csv = typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Download started')
        return
      }
      toast.error('Export not available')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Export failed'))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Reports"
        description="Filterable operational and finance reports"
        action={
          <Can permission="reports:export">
            <Button variant="secondary" loading={exporting} onClick={onExport}>
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </Can>
        }
      />
      <Card>
        <CardHeader
          title="Filters"
          action={
            <div className="flex flex-wrap gap-2">
              <Select value={type} onChange={(e) => setType(e.target.value)} className="w-44">
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="No report data" description="Adjust filters or wait for backend aggregations." />
          ) : (
            <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-5 py-3 font-medium">
                        {String(col).replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row._id || idx} className="border-b border-ink-50">
                      {columns.map((col) => (
                        <td key={col} className="px-5 py-3">
                          {typeof row[col] === 'object' && row[col] !== null
                            ? JSON.stringify(row[col])
                            : String(row[col] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
