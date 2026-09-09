import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Permission } from '../modules/roles/permission.model.js';
import { Role } from '../modules/roles/role.model.js';
import { User } from '../modules/users/user.model.js';
import { Branch } from '../modules/branches/branch.model.js';
import { Setting } from '../modules/settings/setting.model.js';
import { PERMISSION_DEFINITIONS, ROLE_DEFINITIONS } from './permissions.js';
import { seedDemoIfEmpty } from './demo.js';

async function seedPermissions() {
  const ops = PERMISSION_DEFINITIONS.map((p) => ({
    updateOne: {
      filter: { code: `${p.module}:${p.action}` },
      update: {
        $set: {
          module: p.module,
          action: p.action,
          code: `${p.module}:${p.action}`,
          description: p.description,
        },
      },
      upsert: true,
    },
  }));
  await Permission.bulkWrite(ops);
  return Permission.find().lean();
}

async function seedRoles(allPermissions) {
  const byCode = Object.fromEntries(allPermissions.map((p) => [p.code, p._id]));

  for (const def of ROLE_DEFINITIONS) {
    const permissionIds =
      def.permissions === 'ALL'
        ? allPermissions.map((p) => p._id)
        : def.permissions.map((code) => byCode[code]).filter(Boolean);

    await Role.findOneAndUpdate(
      { slug: def.slug },
      {
        $set: {
          name: def.name,
          slug: def.slug,
          description: def.description,
          isSystem: def.isSystem,
          permissions: permissionIds,
          status: 'ACTIVE',
        },
      },
      { upsert: true, new: true }
    );
  }
}

async function seedBranch() {
  return Branch.findOneAndUpdate(
    { code: 'HO' },
    {
      $set: {
        name: 'Head Office',
        code: 'HO',
        phone: '+91-9999999999',
        email: 'office@tms.local',
        address: {
          line1: 'Transport Hub',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001',
        },
        status: 'ACTIVE',
        isHeadOffice: true,
      },
    },
    { upsert: true, new: true }
  );
}

async function seedAdmin(branch) {
  const role = await Role.findOne({ slug: 'super-admin' });
  if (!role) throw new Error('super-admin role missing');

  const passwordHash = await User.hashPassword(env.seed.adminPassword);
  const admin = await User.findOneAndUpdate(
    { email: env.seed.adminEmail },
    {
      $set: {
        name: env.seed.adminName,
        email: env.seed.adminEmail,
        passwordHash,
        role: role._id,
        branch: branch._id,
        portalType: 'STAFF',
        status: 'ACTIVE',
        emailVerified: true,
      },
    },
    { upsert: true, new: true }
  );

  return admin;
}

async function seedSettings() {
  const defaults = [
    { key: 'company.name', value: 'SwiftHaul Transport', group: 'company', description: 'Company display name' },
    { key: 'company.tagline', value: 'Transport Management ERP', group: 'company', description: 'Brand tagline' },
    { key: 'company.logoUrl', value: '', group: 'company', description: 'Dashboard logo URL' },
    { key: 'company.faviconUrl', value: '', group: 'company', description: 'Browser favicon URL' },
    { key: 'company.supportEmail', value: 'office@tms.local', group: 'company', description: 'Public support email' },
    { key: 'company.supportPhone', value: '+91-9999999999', group: 'company', description: 'Public support phone' },
    { key: 'company.gstin', value: '', group: 'company', description: 'GSTIN' },
    { key: 'company.currency', value: 'INR', group: 'company', description: 'Default currency' },
    { key: 'company.timezone', value: 'Asia/Kolkata', group: 'company', description: 'Default timezone' },
    { key: 'booking.prefix', value: 'BK', group: 'bookings', description: 'Booking number prefix' },
    { key: 'trip.prefix', value: 'TR', group: 'trips', description: 'Trip number prefix' },
    { key: 'invoice.prefix', value: 'INV', group: 'invoices', description: 'Invoice number prefix' },
  ];

  for (const item of defaults) {
    await Setting.findOneAndUpdate({ key: item.key }, { $set: item }, { upsert: true });
  }
}

async function run() {
  await connectDB();
  console.log('Seeding permissions...');
  const permissions = await seedPermissions();
  console.log(`Permissions: ${permissions.length}`);

  console.log('Seeding roles...');
  await seedRoles(permissions);

  console.log('Seeding head office branch...');
  const branch = await seedBranch();

  console.log('Seeding settings...');
  await seedSettings();

  console.log('Seeding super admin...');
  const admin = await seedAdmin(branch);

  console.log('Seed complete.');
  console.log(`Admin login: ${admin.email} / ${env.seed.adminPassword}`);

  console.log('Seeding demo operational data (if empty)...');
  await seedDemoIfEmpty();

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
