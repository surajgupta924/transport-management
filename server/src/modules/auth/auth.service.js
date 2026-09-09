import crypto from 'crypto';
import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
import { Customer } from '../customers/customer.model.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshExpiryDate,
} from '../../utils/tokens.js';
import { writeAuditLog } from '../audit/audit.service.js';

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  delete obj.refreshTokens;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
}

function buildAuthPayload(user) {
  return {
    sub: user._id.toString(),
    role: user.role?.slug || user.role?.toString(),
    portalType: user.portalType,
  };
}

function issueTokens(user, meta = {}) {
  const payload = buildAuthPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: getRefreshExpiryDate(),
    meta,
  };
}

async function ensureLinkedCustomer(user) {
  if (user.portalType !== 'CUSTOMER') return user;
  if (user.linkedCustomer) return user;
  let customer = user.email ? await Customer.findOne({ email: user.email }) : null;
  if (!customer) {
    customer = await Customer.create({
      type: 'INDIVIDUAL',
      source: 'ONLINE',
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      portalUser: user._id,
      status: 'ACTIVE',
    });
  } else if (!customer.portalUser) {
    customer.portalUser = user._id;
    await customer.save();
  }
  user.linkedCustomer = customer._id;
  await user.save();
  return user;
}

export async function registerCustomer({ name, email, mobile, password, portalType = 'CUSTOMER' }, req) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered', null, 'DUPLICATE');
  }

  const roleSlug = portalType === 'CUSTOMER' ? 'customer' : portalType === 'DRIVER' ? 'driver' : 'staff';
  const role = await Role.findOne({ slug: roleSlug });
  if (!role) {
    throw new ApiError(500, `Default role "${roleSlug}" is not seeded`);
  }

  const passwordHash = await User.hashPassword(password);
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    email,
    mobile: mobile || undefined,
    passwordHash,
    role: role._id,
    portalType,
    status: portalType === 'CUSTOMER' ? 'PENDING_VERIFICATION' : 'ACTIVE',
    emailVerified: portalType !== 'CUSTOMER',
    emailVerificationToken,
  });

  await user.populate({
    path: 'role',
    populate: { path: 'permissions', select: 'code module action' },
  });

  await writeAuditLog({
    actor: user,
    module: 'auth',
    entity: 'User',
    entityId: user._id,
    action: 'REGISTER',
    description: `${user.email} registered as ${portalType}`,
    req,
  });

  // Phase 1: auto-verify for local development when email queue is not yet wired
  if (portalType === 'CUSTOMER') {
    user.status = 'ACTIVE';
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    await ensureLinkedCustomer(user);
  }

  const tokens = issueTokens(user);
  user.refreshTokens = [
    {
      token: tokens.refreshToken,
      expiresAt: tokens.refreshExpiresAt,
      userAgent: req?.headers?.['user-agent'],
      ip: req?.ip,
    },
  ];
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    permissions: (user.role?.permissions || []).map((p) => p.code),
  };
}

export async function login({ email, password }, req) {
  const user = await User.findOne({ email })
    .select('+passwordHash +refreshTokens')
    .populate({
      path: 'role',
      populate: { path: 'permissions', select: 'code module action' },
    })
    .populate('branch', 'name code');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password', null, 'INVALID_CREDENTIALS');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password', null, 'INVALID_CREDENTIALS');
  }

  if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    throw new ApiError(403, 'Your account is not active. Contact support.', null, 'ACCOUNT_DISABLED');
  }

  if (user.status === 'PENDING_VERIFICATION') {
    throw new ApiError(403, 'Please verify your email before logging in', null, 'EMAIL_NOT_VERIFIED');
  }

  const tokens = issueTokens(user);
  user.refreshTokens = (user.refreshTokens || [])
    .filter((t) => t.expiresAt > new Date())
    .slice(-4);
  user.refreshTokens.push({
    token: tokens.refreshToken,
    expiresAt: tokens.refreshExpiresAt,
    userAgent: req?.headers?.['user-agent'],
    ip: req?.ip,
  });
  user.lastLoginAt = new Date();
  await user.save();
  await ensureLinkedCustomer(user);
  await user.populate('linkedCustomer', 'name company email mobile');
  await user.populate('linkedDriver', 'name mobile status');

  await writeAuditLog({
    actor: user,
    module: 'auth',
    entity: 'User',
    entityId: user._id,
    action: 'LOGIN',
    description: `${user.email} logged in`,
    req,
  });

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    permissions: (user.role?.permissions || []).map((p) => p.code),
  };
}

export async function refresh(refreshToken, req) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token', null, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.sub)
    .select('+refreshTokens')
    .populate({
      path: 'role',
      populate: { path: 'permissions', select: 'code module action' },
    })
    .populate('branch', 'name code');

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'Invalid refresh token', null, 'INVALID_TOKEN');
  }

  const stored = (user.refreshTokens || []).find((t) => t.token === refreshToken);
  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token expired or revoked', null, 'INVALID_TOKEN');
  }

  const tokens = issueTokens(user);
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
  user.refreshTokens.push({
    token: tokens.refreshToken,
    expiresAt: tokens.refreshExpiresAt,
    userAgent: req?.headers?.['user-agent'],
    ip: req?.ip,
  });
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    permissions: (user.role?.permissions || []).map((p) => p.code),
  };
}

export async function logout(userId, refreshToken, req) {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  if (refreshToken) {
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
  } else {
    user.refreshTokens = [];
  }
  await user.save();

  await writeAuditLog({
    actor: user,
    module: 'auth',
    entity: 'User',
    entityId: user._id,
    action: 'LOGOUT',
    description: `${user.email} logged out`,
    req,
  });
}

export async function getMe(userId) {
  const user = await User.findById(userId)
    .populate({
      path: 'role',
      populate: { path: 'permissions', select: 'code module action description' },
    })
    .populate('branch', 'name code')
    .populate('linkedCustomer', 'name company email mobile')
    .populate('linkedDriver', 'name mobile status');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    user: sanitizeUser(user),
    permissions: (user.role?.permissions || []).map((p) => p.code),
  };
}

export async function changePassword(userId, { currentPassword, newPassword }, req) {
  const user = await User.findById(userId).select('+passwordHash +refreshTokens');
  if (!user) throw new ApiError(404, 'User not found');

  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.refreshTokens = [];
  await user.save();

  await writeAuditLog({
    actor: user,
    module: 'auth',
    entity: 'User',
    entityId: user._id,
    action: 'CHANGE_PASSWORD',
    description: `${user.email} changed password`,
    req,
  });

  return { message: 'Password updated successfully' };
}
