import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthBootstrap, GuestOnly, RequireAuth, RequirePermission, RequirePortal } from './guards'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { UsersPage } from '../features/users/UsersPage'
import { RolesPage } from '../features/roles/RolesPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { CustomerFormPage } from '../features/customers/CustomerFormPage'
import { CustomerDetailPage } from '../features/customers/CustomerDetailPage'
import { VehiclesPage } from '../features/vehicles/VehiclesPage'
import { VehicleFormPage } from '../features/vehicles/VehicleFormPage'
import { VehicleDetailPage } from '../features/vehicles/VehicleDetailPage'
import { DriversPage } from '../features/drivers/DriversPage'
import { DriverFormPage } from '../features/drivers/DriverFormPage'
import { DriverDetailPage } from '../features/drivers/DriverDetailPage'
import { BookingsPage } from '../features/bookings/BookingsPage'
import { BookingFormPage } from '../features/bookings/BookingFormPage'
import { BookingDetailPage } from '../features/bookings/BookingDetailPage'
import { TripsPage } from '../features/trips/TripsPage'
import { TripDetailPage } from '../features/trips/TripDetailPage'
import { TrackingPage, TrackingIndexPage } from '../features/tracking/TrackingPage'
import { GpsPage } from '../features/gps/GpsPage'
import { LoadingStaffPage } from '../features/loading-staff/LoadingStaffPage'
import { HiredVehiclesPage } from '../features/hired-vehicles/HiredVehiclesPage'
import { ShipmentsPage } from '../features/shipments/ShipmentsPage'
import { AssignmentsPage } from '../features/operations/AssignmentsPage'
import { ActiveTripsPage } from '../features/operations/ActiveTripsPage'
import { InvoiceDesignerPage } from '../features/invoices/InvoiceDesignerPage'
import { TripExpensesPage } from '../features/trips/TripExpensesPage'
import { TripSettlementPage } from '../features/trips/TripSettlementPage'
import { FuelPage } from '../features/fuel/FuelPage'
import { MaintenancePage } from '../features/maintenance/MaintenancePage'
import { ExpensesPage } from '../features/expenses/ExpensesPage'
import { PodsPage } from '../features/pod/PodsPage'
import { InvoicesPage } from '../features/invoices/InvoicesPage'
import { InvoiceDetailPage } from '../features/invoices/InvoiceDetailPage'
import { PaymentsPage } from '../features/payments/PaymentsPage'
import { LedgerPage } from '../features/ledger/LedgerPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { SupportPage } from '../features/support/SupportPage'
import { SupportDetailPage } from '../features/support/SupportDetailPage'
import { BranchesPage } from '../features/branches/BranchesPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { VendorsPage } from '../features/vendors/VendorsPage'
import { AuditLogsPage } from '../features/audit/AuditLogsPage'
import { SettlementsPage } from '../features/settlements/SettlementsPage'
import { DriverShell } from '../features/driver-portal/DriverShell'
import { DriverDashboardPage } from '../features/driver-portal/DriverDashboardPage'
import { DriverTripsPage } from '../features/driver-portal/DriverTripsPage'
import { DriverActiveTripPage, DriverTripDetailPage } from '../features/driver-portal/DriverActiveTripPage'
import { DriverExpensesPage } from '../features/driver-portal/DriverExpensesPage'
import { DriverBookingPage } from '../features/driver-portal/DriverBookingPage'
import { DriverPodPage } from '../features/driver-portal/DriverPodPage'
import { DriverProfilePage } from '../features/driver-portal/DriverProfilePage'
import { PortalShell } from '../features/customer-portal/PortalShell'
import { PortalDashboardPage } from '../features/customer-portal/PortalDashboardPage'
import { PortalBookingsPage } from '../features/customer-portal/PortalBookingsPage'
import { PortalBookingFormPage } from '../features/customer-portal/PortalBookingFormPage'
import { PortalBookingDetailPage } from '../features/customer-portal/PortalBookingDetailPage'
import { PortalTrackPage } from '../features/customer-portal/PortalTrackPage'
import { PortalInvoicesPage } from '../features/customer-portal/PortalInvoicesPage'
import { PortalSupportPage } from '../features/customer-portal/PortalSupportPage'
import { PortalSupportDetailPage } from '../features/customer-portal/PortalSupportDetailPage'
import { HomePage } from '../features/home/HomePage'

export function AppRouter() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<RequirePortal portal="STAFF" />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route element={<RequirePermission permission="dashboard:view" />}>
                <Route path="dashboard" element={<DashboardPage />} />
              </Route>
              <Route element={<RequirePermission permission="users:view" />}>
                <Route path="users" element={<UsersPage />} />
              </Route>
              <Route element={<RequirePermission permission="roles:view" />}>
                <Route path="roles" element={<RolesPage />} />
              </Route>
              <Route element={<RequirePermission permission="customers:view" />}>
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/new" element={<CustomerFormPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="customers/:id/edit" element={<CustomerFormPage />} />
              </Route>
              <Route element={<RequirePermission permission="vehicles:view" />}>
                <Route path="vehicles" element={<VehiclesPage />} />
                <Route path="vehicles/new" element={<VehicleFormPage />} />
                <Route path="vehicles/:id" element={<VehicleDetailPage />} />
                <Route path="vehicles/:id/edit" element={<VehicleFormPage />} />
              </Route>
              <Route element={<RequirePermission permission="drivers:view" />}>
                <Route path="drivers" element={<DriversPage />} />
                <Route path="drivers/new" element={<DriverFormPage />} />
                <Route path="drivers/:id" element={<DriverDetailPage />} />
                <Route path="drivers/:id/edit" element={<DriverFormPage />} />
              </Route>
              <Route element={<RequirePermission permission="bookings:view" />}>
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/new" element={<BookingFormPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
                <Route path="bookings/:id/edit" element={<BookingFormPage />} />
                <Route path="shipments" element={<ShipmentsPage />} />
              </Route>
              <Route element={<RequirePermission permission="trips:view" />}>
                <Route path="trips" element={<TripsPage />} />
                <Route path="trips/:id" element={<TripDetailPage />} />
                <Route path="tracking" element={<TrackingIndexPage />} />
                <Route path="tracking/:tripId" element={<TrackingPage />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="active-trips" element={<ActiveTripsPage />} />
              </Route>
              <Route element={<RequirePermission permission="loadingStaff:view" />}>
                <Route path="loading-staff" element={<LoadingStaffPage />} />
              </Route>
              <Route element={<RequirePermission permission="hiredVehicles:view" />}>
                <Route path="hired-vehicles" element={<HiredVehiclesPage />} />
              </Route>
              <Route element={<RequirePermission permission="gps:view" />}>
                <Route path="gps" element={<GpsPage />} />
              </Route>
              <Route element={<RequirePermission permission="fuel:view" />}>
                <Route path="fuel" element={<FuelPage />} />
              </Route>
              <Route element={<RequirePermission permission="maintenance:view" />}>
                <Route path="maintenance" element={<MaintenancePage />} />
              </Route>
              <Route element={<RequirePermission permission="expenses:view" />}>
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="settlements" element={<SettlementsPage />} />
                <Route path="trip-expenses" element={<TripExpensesPage />} />
                <Route path="trip-settlement" element={<TripSettlementPage />} />
              </Route>
              <Route element={<RequirePermission permission="pod:view" />}>
                <Route path="pod" element={<PodsPage />} />
              </Route>
              <Route element={<RequirePermission permission="invoices:view" />}>
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="invoice-designer" element={<InvoiceDesignerPage />} />
              </Route>
              <Route element={<RequirePermission permission="payments:view" />}>
                <Route path="payments" element={<PaymentsPage />} />
              </Route>
              <Route element={<RequirePermission permission="ledger:view" />}>
                <Route path="ledger" element={<LedgerPage />} />
              </Route>
              <Route element={<RequirePermission permission="reports:view" />}>
                <Route path="reports" element={<ReportsPage />} />
              </Route>
              <Route element={<RequirePermission permission="notifications:view" />}>
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
              <Route element={<RequirePermission permission="support:view" />}>
                <Route path="support" element={<SupportPage />} />
                <Route path="support/:id" element={<SupportDetailPage />} />
              </Route>
              <Route element={<RequirePermission permission="branches:view" />}>
                <Route path="branches" element={<BranchesPage />} />
              </Route>
              <Route element={<RequirePermission permission="settings:view" />}>
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route element={<RequirePermission permission="vendors:view" />}>
                <Route path="vendors" element={<VendorsPage />} />
              </Route>
              <Route element={<RequirePermission permission="audit:view" />}>
                <Route path="audit" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RequirePortal portal="DRIVER" />}>
            <Route path="/driver" element={<DriverShell />}>
              <Route index element={<DriverDashboardPage />} />
              <Route path="trips" element={<DriverTripsPage />} />
              <Route path="assignments" element={<DriverTripsPage />} />
              <Route path="trips/:id" element={<DriverTripDetailPage />} />
              <Route path="active" element={<DriverActiveTripPage />} />
              <Route path="deliveries" element={<DriverActiveTripPage />} />
              <Route path="bookings/new" element={<DriverBookingPage />} />
              <Route path="expenses" element={<DriverExpensesPage />} />
              <Route path="pod" element={<DriverPodPage />} />
              <Route path="profile" element={<DriverProfilePage />} />
            </Route>
          </Route>

          <Route element={<RequirePortal portal="CUSTOMER" />}>
            <Route path="/portal" element={<PortalShell />}>
              <Route index element={<PortalDashboardPage />} />
              <Route path="create" element={<PortalBookingFormPage />} />
              <Route path="bookings" element={<PortalBookingsPage />} />
              <Route path="bookings/new" element={<PortalBookingFormPage />} />
              <Route path="bookings/:id" element={<PortalBookingDetailPage />} />
              <Route path="track" element={<PortalTrackPage />} />
              <Route path="track/:tripId" element={<PortalTrackPage />} />
              <Route path="invoices" element={<PortalInvoicesPage />} />
              <Route path="support" element={<PortalSupportPage />} />
              <Route path="support/:id" element={<PortalSupportDetailPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthBootstrap>
  )
}
