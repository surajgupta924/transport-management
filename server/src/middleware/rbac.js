import { ApiError } from '../utils/ApiError.js';

export function requirePermission(...required) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', null, 'UNAUTHORIZED'));
    }

    if (req.user.role?.slug === 'super-admin') {
      return next();
    }

    const codes = req.permissionCodes || new Set();
    const allowed = required.every((code) => codes.has(code));

    if (!allowed) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action', null, 'FORBIDDEN')
      );
    }

    return next();
  };
}

export function requireAnyPermission(...required) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', null, 'UNAUTHORIZED'));
    }

    if (req.user.role?.slug === 'super-admin') {
      return next();
    }

    const codes = req.permissionCodes || new Set();
    const allowed = required.some((code) => codes.has(code));

    if (!allowed) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action', null, 'FORBIDDEN')
      );
    }

    return next();
  };
}

export function requirePortal(...portals) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', null, 'UNAUTHORIZED'));
    }
    if (!portals.includes(req.user.portalType)) {
      return next(new ApiError(403, 'Access denied for this portal', null, 'FORBIDDEN'));
    }
    return next();
  };
}
