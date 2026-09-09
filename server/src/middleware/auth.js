import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/ApiError.js';
import { User } from '../modules/users/user.model.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentication required', null, 'UNAUTHORIZED');
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.sub)
    .populate({
      path: 'role',
      populate: { path: 'permissions', select: 'code module action' },
    })
    .populate('branch', 'name code');

  if (!user || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    throw new ApiError(401, 'Account is not active', null, 'UNAUTHORIZED');
  }

  req.user = user;
  req.permissionCodes = new Set((user.role?.permissions || []).map((p) => p.code));
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub)
      .populate({
        path: 'role',
        populate: { path: 'permissions', select: 'code module action' },
      })
      .populate('branch', 'name code');
    if (user && user.status === 'ACTIVE') {
      req.user = user;
      req.permissionCodes = new Set((user.role?.permissions || []).map((p) => p.code));
    }
  } catch {
    // ignore invalid optional token
  }
  next();
});
