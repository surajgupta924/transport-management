import { useMemo, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useCreateLoadingStaffMutation, useGetLoadingStaffQuery, useUpdateLoadingStaffMutation } from './loadingStaffApi'
import { useGetBranchesQuery } from '../branches/branchesApi'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, TableSkeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/OpsUi'
import { useToast } from '../../components/ui/Toast'
import { formatMoney, getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const empty = { name: '', mobile: '', designation: 'LOADER', incentiveRate: 10, branchId: '', status: 'ACTIVE' }

export function LoadingStaffPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const queryArgs = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, isFetching } = useGetLoadingStaffQuery(queryArgs)
  const { data: branchesData } = useGetBranchesQuery({ limit: 50 })
  const [createStaff, { isLoading: creating }] = useCreateLoadingStaffMutation()
  const [updateStaff, { isLoading: updating }] = useUpdateLoadingStaffMutation()
  const rows = data?.data || []
  const branches = branchesData?.data || []

  const save = async () => {
    try {
      if (editing) await updateStaff({ id: editing, ...form }).unwrap()
      else await createStaff(form).unwrap()
      toast.success(editing ? 'Staff updated' : 'Staff added')
      setOpen(false)
      setEditing(null)
      setForm(empty)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        eyebrow="FLEET SETUP"
        title="Loading Staff"
        description="Manage loaders, supervisors, helpers and warehouse staff."
        action={
          <Can permission="loadingStaff:create">
            <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true) }}>
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          </Can>
        }
      />
      <Card>
        <CardHeader
          title="Staff directory"
          action={
            <Input placeholder="Search name, code or branch" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} className="w-64" />
          }
        />
        <CardBody className="p-0">
          {isLoading ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState icon={Users} title="No loading staff" description="Add loaders to assign them on shipments." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    {['Staff Member', 'Employee Code', 'Contact', 'Designation', 'Incentive Rate', 'Earned Incentive', 'Branch', 'Loading Activity', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-60' : ''}>
                  {rows.map((row) => (
                    <tr key={row._id} className="border-b border-ink-50">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.employeeCode}</td>
                      <td className="px-4 py-3">{row.mobile || '—'}</td>
                      <td className="px-4 py-3">{row.designation}</td>
                      <td className="px-4 py-3">{formatMoney(row.incentiveRate)}/quintal</td>
                      <td className="px-4 py-3 text-emerald-700">{formatMoney(row.earnedIncentive)}</td>
                      <td className="px-4 py-3">{row.branch?.name || '—'}</td>
                      <td className="px-4 py-3 text-ink-500">{row.loadsCount || 0} loads · {row.supervisedCount || 0} supervised</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditing(row._id)
                          setForm({
                            name: row.name,
                            mobile: row.mobile || '',
                            designation: row.designation,
                            incentiveRate: row.incentiveRate,
                            branchId: row.branch?._id || '',
                            status: row.status,
                          })
                          setOpen(true)
                        }}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStaff({ id: row._id, status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                          {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </CardBody>
      </Card>

      <Modal open={open} title={editing ? 'Edit staff' : 'Add Staff'} onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value }))} />
          <Select label="Designation" value={form.designation} onChange={(e) => setForm((s) => ({ ...s, designation: e.target.value }))}>
            <option value="LOADER">Loader</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="HELPER">Helper</option>
            <option value="WAREHOUSE">Warehouse</option>
          </Select>
          <Input label="Incentive rate / quintal" type="number" value={form.incentiveRate} onChange={(e) => setForm((s) => ({ ...s, incentiveRate: Number(e.target.value) }))} />
          <Select label="Branch" value={form.branchId} onChange={(e) => setForm((s) => ({ ...s, branchId: e.target.value }))}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={creating || updating} onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
