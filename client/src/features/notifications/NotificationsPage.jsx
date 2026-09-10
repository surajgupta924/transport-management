import { useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from './notificationsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState } from '../../components/common/EmptyState'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

const FILTERS = ['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR']

export function NotificationsPage() {
  const toast = useToast()
  const [type, setType] = useState('ALL')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(() => ({ page, limit: 20, type: type === 'ALL' ? undefined : type, unread: unreadOnly ? 'true' : undefined }), [page, type, unreadOnly])
  const { data, isFetching } = useGetNotificationsQuery(queryArgs)
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()
  const rows = data?.data || []
  const meta = data?.meta || {}

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Notifications"
        description="System updates, shipment alerts, and payment notifications."
        action={<Button variant="secondary" loading={markingAll} onClick={async () => { try { await markAll().unwrap(); toast.success('All marked read') } catch (err) { toast.error(getErrorMessage(err)) } }}>Mark all as read</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total notifications" value={meta.total || rows.length} />
        <StatCard label="Unread" value={meta.unreadCount || 0} tone="blue" active={unreadOnly} onClick={() => setUnreadOnly((v) => !v)} />
        <StatCard label="Warnings" value={meta.warningCount || 0} tone="amber" />
        <StatCard label="Success updates" value={meta.successCount || 0} tone="green" />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => { setType(f); setPage(1) }} className={`rounded-full px-4 py-1.5 text-sm ${type === f ? 'bg-slate-900 text-white' : 'bg-white text-ink-600 shadow-sm'}`}>{f}</button>
        ))}
      </div>
      <Card>
        <CardBody className={`space-y-2 ${isFetching ? 'opacity-60' : ''}`}>
          {rows.length === 0 ? <EmptyState icon={Bell} title="No notifications" /> : rows.map((n) => (
            <button key={n._id} type="button" onClick={() => !n.readAt && markRead(n._id)} className={`w-full rounded-2xl border px-4 py-3 text-left ${n.readAt ? 'border-ink-100 bg-white' : 'border-blue-100 bg-blue-50/50'}`}>
              <p className="text-sm font-medium text-ink-900">{n.title} {!n.readAt && <span className="text-blue-600">●</span>}</p>
              <p className="text-sm text-ink-600">{n.body}</p>
              <p className="mt-1 text-xs uppercase text-ink-400">{n.type} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
            </button>
          ))}
          <Pagination meta={meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
