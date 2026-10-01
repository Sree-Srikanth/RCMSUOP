import { now } from './util.js';

const json = (v) => (v === undefined || v === null ? null : JSON.stringify(v));

/** Append an immutable audit log entry (Requirements §31). */
export function audit(req, action, entityType, entityId, oldValues, newValues) {
  const { db } = req.ctx;
  db.prepare(
    `INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, old_values, new_values, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    req.user?.id ?? null,
    req.user?.role ?? null,
    action,
    entityType ?? null,
    entityId === undefined || entityId === null ? null : String(entityId),
    json(oldValues),
    json(newValues),
    req.ip ?? null,
    String(req.headers?.['user-agent'] || '').slice(0, 300) || null,
    now(),
  );
}

/** Shallow diff of two records restricted to the given keys. */
export function diff(before, after, keys) {
  const oldV = {};
  const newV = {};
  for (const k of keys ?? Object.keys(after)) {
    if ((before?.[k] ?? null) !== (after?.[k] ?? null)) {
      oldV[k] = before?.[k] ?? null;
      newV[k] = after?.[k] ?? null;
    }
  }
  return Object.keys(newV).length ? [oldV, newV] : null;
}
