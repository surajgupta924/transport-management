import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store'
import { AppRouter } from './app/router'
import { ToastProvider } from './components/ui/Toast'
import { BrandingProvider } from './features/settings/BrandingProvider'
import './features/auth/authApi'
import './features/users/usersApi'
import './features/roles/rolesApi'
import './features/dashboard/dashboardApi'
import './features/customers/customersApi'
import './features/vehicles/vehiclesApi'
import './features/drivers/driversApi'
import './features/bookings/bookingsApi'
import './features/trips/tripsApi'
import './features/fuel/fuelApi'
import './features/maintenance/maintenanceApi'
import './features/expenses/expensesApi'
import './features/pod/podApi'
import './features/invoices/invoicesApi'
import './features/payments/paymentsApi'
import './features/ledger/ledgerApi'
import './features/reports/reportsApi'
import './features/notifications/notificationsApi'
import './features/support/supportApi'
import './features/branches/branchesApi'
import './features/settings/settingsApi'
import './features/vendors/vendorsApi'
import './features/audit/auditApi'
import './features/settlements/settlementsApi'
import './features/uploads/uploadsApi'

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <BrandingProvider>
            <AppRouter />
          </BrandingProvider>
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  )
}
