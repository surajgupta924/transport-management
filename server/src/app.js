import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import vehicleRoutes from './modules/vehicles/vehicle.routes.js';
import driverRoutes from './modules/drivers/driver.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import tripRoutes from './modules/trips/trip.routes.js';
import routeRoutes from './modules/routes/route.routes.js';
import fuelRoutes from './modules/fuel/fuel.routes.js';
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import settlementRoutes from './modules/settlements/settlement.routes.js';
import podRoutes from './modules/pod/pod.routes.js';
import invoiceRoutes from './modules/invoices/invoice.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import ledgerRoutes from './modules/ledger/ledger.routes.js';
import vendorRoutes from './modules/vendors/vendor.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import supportRoutes from './modules/support/support.routes.js';
import branchRoutes from './modules/branches/branch.routes.js';
import settingRoutes from './modules/settings/setting.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import loadingStaffRoutes from './modules/loadingStaff/loadingStaff.routes.js';
import hiredVehicleRoutes from './modules/hiredVehicles/hiredVehicle.routes.js';
import gpsRoutes from './modules/gps/gps.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const allowedOrigins = String(env.clientUrl || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
          /^http:\/\/localhost(:\d+)?$/i.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(
    '/api/',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  const uploadRoot = path.isAbsolute(env.uploadDir)
    ? env.uploadDir
    : path.join(process.cwd(), env.uploadDir);
  app.use('/uploads', express.static(uploadRoot));

  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'TMS API healthy', data: { env: env.nodeEnv } });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/roles', roleRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/vehicles', vehicleRoutes);
  app.use('/api/v1/drivers', driverRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/routes', routeRoutes);
  app.use('/api/v1/fuel', fuelRoutes);
  app.use('/api/v1/maintenance', maintenanceRoutes);
  app.use('/api/v1/expenses', expenseRoutes);
  app.use('/api/v1/settlements', settlementRoutes);
  app.use('/api/v1/pod', podRoutes);
  app.use('/api/v1/invoices', invoiceRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/ledgers', ledgerRoutes);
  app.use('/api/v1/vendors', vendorRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/support', supportRoutes);
  app.use('/api/v1/branches', branchRoutes);
  app.use('/api/v1/settings', settingRoutes);
  app.use('/api/v1/audit-logs', auditRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/uploads', uploadRoutes);
  app.use('/api/v1/loading-staff', loadingStaffRoutes);
  app.use('/api/v1/hired-vehicles', hiredVehicleRoutes);
  app.use('/api/v1/gps', gpsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
