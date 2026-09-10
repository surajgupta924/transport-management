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

const empty = {
  name: '',
  mobile: '',
  employeeCode: '',
  designation: 'LOADER',
  salaryType: 'MONTHLY',
  monthlySalary: 0,
  incentiveUnit: 'PER_KG',
  incentiveRate: 10,
  joiningDate: '',
  branchName: '',
  branchId: '',
  status: 'ACTIVE',
  address: '',
}

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
      const payload = {
        ...form,
        employeeCode: editing ? form.employeeCode : undefined,
        joiningDate: form.joiningDate || undefined,
        monthlySalary: Number(form.monthlySalary) || 0,
        incentiveRate: Number(form.incentiveRate) || 0,
        branchId: form.branchId || undefined,
      }
      if (editing) await updateStaff({ id: editing, ...payload }).unwrap()
      else await createStaff(payload).unwrap()
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
                      <td className="px-4 py-3">{formatMoney(row.incentiveRate)}/{row.incentiveUnit === 'PER_KG' ? 'kg' : row.incentiveUnit === 'PER_LOAD' ? 'load' : 'quintal'}</td>
                      <td className="px-4 py-3 text-emerald-700">{formatMoney(row.earnedIncentive)}</td>
                      <td className="px-4 py-3">{row.branchName || row.branch?.name || '—'}</td>
                      <td className="px-4 py-3 text-ink-500">{row.loadsCount || 0} loads · {row.supervisedCount || 0} supervised</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditing(row._id)
                          setForm({
                            name: row.name,
                            mobile: row.mobile || '',
                            employeeCode: row.employeeCode || '',
                            designation: row.designation,
                            salaryType: row.salaryType || 'MONTHLY',
                            monthlySalary: row.monthlySalary || 0,
                            incentiveUnit: row.incentiveUnit || 'PER_KG',
                            incentiveRate: row.incentiveRate,
                            joiningDate: row.joiningDate ? String(row.joiningDate).slice(0, 10) : '',
                            branchName: row.branchName || row.branch?.name || '',
                            branchId: row.branch?._id || '',
                            status: row.status,
                            address: row.address || '',
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

      <Modal open={open} title={editing ? 'Edit Staff Member' : 'Add Staff Member'} description="Set salary mode and loading incentive." onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <Input label="Mobile Number" required value={form.mobile} onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value }))} />
          <Input label="Employee Code" value={form.employeeCode || 'Auto generated'} readOnly />
          <Select label="Designation" value={form.designation} onChange={(e) => setForm((s) => ({ ...s, designation: e.target.value }))}>
            <option value="LOADER">Loader</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="HELPER">Helper</option>
            <option value="WAREHOUSE">Warehouse</option>
          </Select>
          <Select label="Salary Type" value={form.salaryType} onChange={(e) => setForm((s) => ({ ...s, salaryType: e.target.value }))}>
            <option value="MONTHLY">Monthly Salary</option>
            <option value="DAILY">Daily</option>
            <option value="INCENTIVE">Incentive only</option>
          </Select>
          <Input label="Monthly Salary (₹)" type="number" value={form.monthlySalary} onChange={(e) => setForm((s) => ({ ...s, monthlySalary: Number(e.target.value) }))} />
          <Select label="Incentive Unit" value={form.incentiveUnit} onChange={(e) => setForm((s) => ({ ...s, incentiveUnit: e.target.value }))}>
            <option value="PER_KG">Per KG</option>
            <option value="PER_QUINTAL">Per Quintal</option>
            <option value="PER_LOAD">Per Load</option>
          </Select>
          <Input label="Incentive Rate (₹ / unit)" required type="number" value={form.incentiveRate} onChange={(e) => setForm((s) => ({ ...s, incentiveRate: Number(e.target.value) }))} />
          <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm((s) => ({ ...s, joiningDate: e.target.value }))} />
          <Select label="Status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Input label="Branch" value={form.branchName} onChange={(e) => setForm((s) => ({ ...s, branchName: e.target.value }))} />
          <Select label="Linked branch record" value={form.branchId} onChange={(e) => setForm((s) => ({ ...s, branchId: e.target.value }))}>
            <option value="">Optional</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <Input className="md:col-span-2" label="Address" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={creating || updating} onClick={save}>{editing ? 'Save' : 'Add Staff'}</Button>
        </div>
      </Modal>
    </div>
  )
}
