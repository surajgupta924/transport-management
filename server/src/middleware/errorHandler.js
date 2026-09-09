import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;
  let code = err.code || null;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
  }

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  }

  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value';
    const fields = Object.keys(err.keyPattern || {});
    errors = fields.map((field) => ({ field, message: `${field} already exists` }));
    code = 'DUPLICATE';
  }

  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  if (!env.isProd && status === 500) {
    console.error(err);
  }

  return sendError(res, { status, message, errors, code });
}
