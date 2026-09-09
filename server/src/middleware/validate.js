import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ApiError(400, 'Validation failed', errors, 'VALIDATION_ERROR'));
      }
      return next(err);
    }
  };
}
