export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sort) {
    const fields = String(query.sort).split(',');
    sort = {};
    for (const field of fields) {
      if (field.startsWith('-')) sort[field.slice(1)] = -1;
      else sort[field] = 1;
    }
  }

  return { page, limit, skip, sort, search: query.search?.trim() || '' };
}

export function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
