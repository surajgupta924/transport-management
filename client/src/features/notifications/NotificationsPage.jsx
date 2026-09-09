import { useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from './notificationsApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'

export function NotificationsPage() {
  const toast = useToast()
  const [unreadOnly, setUnreadOnly] = useState('')
  const [page, setPage] = useState(1)
  const queryArgs = useMemo(
    () => ({ page, limit: 20, unread: unreadOnly || undefined }),
    [page, unreadOnly]
  )
  const { data, isLoading, isFetching } = useGetNotificationsQuery(queryArgs)
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()
  const rows = data?.data || []

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Notifications"
        description="System alerts, reminders, and trip updates"
        action={
          <Button
            variant="secondary"
            loading={markingAll}
            onClick={async () => {
              try {
                await markAll().unwrap()
                toast.success('All marked read')
              } catch (err) {
                toast.error(getErrorMessage(err))
              }
            }}
          >
            Mark all read
          </Button>
        }
      />
      <Card>
        <CardHeader
          title="Inbox"
          action={
            <Select value={unreadOnly} onChange={(e) => { setPage(1); setUnreadOnly(e.target.value) }} className="w-40">
              <option value="">All</option>
              <option value="true">Unread only</option>
            </Select>
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You’re all caught up." />
          ) : (
            <ul className={`divide-y divide-ink-100 ${isFetching ? 'opacity-60' : ''}`}>
              {rows.map((n) => (
                <li
                  key={n._id}
                  className={`flex items-start justify-between gap-3 px-5 py-4 ${n.readAt || n.isRead ? '' : 'bg-brand-50/40'}`}
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">{n.title || n.subject}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{n.body || n.message}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                  {!(n.readAt || n.isRead) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await markRead(n._id).unwrap()
                        } catch (err) {
                          toast.error(getErrorMessage(err))
                        }
                      }}
                    >
                      Mark read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
