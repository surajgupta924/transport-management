import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAssignTripMutation, useGetTripQuery, useUpdateTripStatusMutation } from './tripsApi'
import { useGetVehiclesQuery } from '../vehicles/vehiclesApi'
import { useGetDriversQuery } from '../drivers/driversApi'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/EmptyState'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage } from '../../lib/utils'
import { Can } from '../../hooks/usePermission'

const assignSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle required'),
  driverId: z.string().min(1, 'Driver required'),
  helperId: z.string().optional(),
})

const workflow = {
  PLANNED: ['ASSIGNED', 'CANCELLED'],
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['STARTED', 'CANCELLED'],
  STARTED: ['IN_TRANSIT', 'IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
}

export function TripDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isLoading } = useGetTripQuery(id)
  const { data: vehiclesData } = useGetVehiclesQuery({ limit: 100, status: 'AVAILABLE' })
  const { data: driversData } = useGetDriversQuery({ limit: 100, status: 'AVAILABLE' })
  const [assignTrip, { isLoading: assigning }] = useAssignTripMutation()
  const [updateStatus, { isLoading: updating }] = useUpdateTripStatusMutation()
  const [showAssign, setShowAssign] = useState(false)
  const trip = data?.data
  const vehicles = vehiclesData?.data || []
  const drivers = driversData?.data || []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: { vehicleId: '', driverId: '', helperId: '' },
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!trip) return <p className="text-sm text-ink-500">Trip not found.</p>

  const onAssign = async (values) => {
    try {
      await assignTrip({
        id,
        vehicleId: values.vehicleId,
        driverId: values.driverId,
        helperId: values.helperId || undefined,
      }).unwrap()
      toast.success('Trip assigned')
      setShowAssign(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const setStatus = async (status) => {
    try {
      await updateStatus({ id, status }).unwrap()
      toast.success(`Status → ${status}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={trip.tripNumber || `Trip ${id.slice(-6)}`}
        description={trip.booking?.bookingNumber || 'Operational trip'}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/app/trips">
              <Button variant="secondary">Back</Button>
            </Link>
            <Link to={`/app/tracking/${id}`}>
              <Button variant="secondary">Live map</Button>
            </Link>
            <Can permission="trips:assign">
              <Button onClick={() => setShowAssign((v) => !v)}>{showAssign ? 'Close assign' : 'Assign'}</Button>
            </Can>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={trip.status} />
        <Can any={['trips:edit', 'trips:assign', 'trips:manage']}>
          {(workflow[trip.status] || []).map((s) => (
            <Button key={s} size="sm" variant="secondary" loading={updating} onClick={() => setStatus(s)}>
              {s.replace(/_/g, ' ')}
            </Button>
          ))}
        </Can>
      </div>

      {showAssign && (
        <Card>
          <CardHeader title="Assign vehicle & driver" />
          <CardBody>
            <form onSubmit={handleSubmit(onAssign)} className="grid gap-4 md:grid-cols-3" noValidate>
              <Select label="Vehicle" required error={errors.vehicleId?.message} {...register('vehicleId')}>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber || v.regNo}
                  </option>
                ))}
              </Select>
              <Select label="Driver" required error={errors.driverId?.message} {...register('driverId')}>
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select label="Helper (optional)" {...register('helperId')}>
                <option value="">None</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <div className="md:col-span-3">
                <Button type="submit" loading={assigning}>
                  Save assignment
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Resources" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Vehicle" value={trip.vehicle?.registrationNumber || trip.vehicle?.regNo} />
            <Row label="Driver" value={trip.driver?.name} />
            <Row label="Helper" value={trip.helper?.name} />
            <Row label="Start KM" value={trip.startKm} />
            <Row label="End KM" value={trip.endKm} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Booking link" />
          <CardBody className="space-y-2 text-sm">
            <Row
              label="Booking"
              value={
                trip.booking?._id ? (
                  <Link className="text-brand-700 hover:underline" to={`/app/bookings/${trip.booking._id}`}>
                    {trip.booking.bookingNumber || 'Open'}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <Row
              label="Route"
              value={`${trip.booking?.pickup?.city || '—'} → ${trip.booking?.delivery?.city || '—'}`}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink-100 pb-2 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value || '—'}</span>
    </div>
  )
}
