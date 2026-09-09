export function sendSuccess(res, { status = 200, message = 'OK', data = null, meta = null } = {}) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(res, { status = 500, message = 'Internal server error', errors = null, code = null } = {}) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (code) body.code = code;
  return res.status(status).json(body);
}
