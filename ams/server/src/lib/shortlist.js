import { badRequest, now } from './util.js';
import { tx } from '../db.js';
import { audit } from './audit.js';

export const DECISIONS = ['SELECTED', 'REJECTED', 'PENDING'];
export const CATEGORIES = ['CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III'];

/** Allowed decision/category combinations for a position (from the DB matrix). */
export function allowedOptions(db, positionId) {
  const rows = db
    .prepare('SELECT decision_code, category_code FROM position_shortlist_decisions WHERE position_id = ? ORDER BY id')
    .all(positionId);
  const decisions = [];
  for (const r of rows) {
    let d = decisions.find((x) => x.decision === r.decision_code);
    if (!d) decisions.push((d = { decision: r.decision_code, categories: [] }));
    if (r.category_code) d.categories.push(r.category_code);
  }
  return decisions.map((d) => ({ ...d, category_required: d.categories.length > 0 }));
}

/**
 * Validates a decision request against the position's matrix (Requirements §15/§17).
 * `category` may arrive as a string, null, or (invalidly) an array.
 */
export function validateDecision(db, positionId, decision, category) {
  if (!DECISIONS.includes(decision)) throw badRequest('Decision must be Selected, Rejected or Pending.');
  if (Array.isArray(category)) {
    const distinct = [...new Set(category.filter(Boolean))];
    if (distinct.length > 1) throw badRequest('Exactly one category may be selected.');
    category = distinct[0] ?? null;
  }
  category = category || null;
  if (category !== null && !CATEGORIES.includes(category)) throw badRequest('Unknown shortlist category.');

  const options = allowedOptions(db, positionId);
  const opt = options.find((o) => o.decision === decision);
  if (!opt) throw badRequest(`The decision ${decision} is not permitted for this position.`);
  if (opt.category_required) {
    if (!category) throw badRequest('A category (Category I, II or III) is required when selecting a candidate for this position.');
    if (!opt.categories.includes(category)) throw badRequest('This category is not permitted for this position.');
  } else if (category) {
    throw badRequest(
      decision === 'SELECTED'
        ? 'Categories are not applicable to this position.'
        : 'A category cannot be attached to a Rejected or Pending decision.',
    );
  }
  return { decision, category };
}

export function currentDecision(db, applicationId) {
  return db.prepare('SELECT * FROM current_shortlist WHERE application_id = ?').get(applicationId) || null;
}

/** Records a decision event atomically with its audit entry. */
export function recordDecision(req, app, decisionInput, categoryInput, remarks) {
  const { db } = req.ctx;
  const { decision, category } = validateDecision(db, app.position_id, decisionInput, categoryInput);
  return tx(db, () => {
    const prev = currentDecision(db, app.id);
    if (prev && prev.decision_code === decision && (prev.category_code || null) === category && (prev.remarks || null) === (remarks || null)) {
      return { unchanged: true, decision: prev };
    }
    const t = now();
    const info = db
      .prepare(
        `INSERT INTO shortlist_decisions (application_id, decision_code, category_code, previous_decision_code, previous_category_code, remarks, decided_by, decided_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(app.id, decision, category, prev?.decision_code ?? null, prev?.category_code ?? null, remarks || null, req.user.id, t);
    if (app.status === 'SUBMITTED') {
      db.prepare("UPDATE applications SET status = 'UNDER_REVIEW', updated_at = ? WHERE id = ?").run(t, app.id);
    }
    audit(
      req,
      prev ? 'SHORTLIST_DECISION_MODIFIED' : 'SHORTLIST_DECISION',
      'application',
      app.id,
      prev ? { decision: prev.decision_code, category: prev.category_code, remarks: prev.remarks } : null,
      { decision, category, remarks: remarks || null, reference_no: app.reference_no },
    );
    return { unchanged: false, decision: db.prepare('SELECT * FROM shortlist_decisions WHERE id = ?').get(info.lastInsertRowid) };
  });
}

export function decisionHistory(db, applicationId) {
  return db
    .prepare(
      `SELECT sd.id, sd.decision_code, sd.category_code, sd.previous_decision_code, sd.previous_category_code, sd.remarks,
              sd.decided_at, u.full_name AS decided_by_name, u.role AS decided_by_role
       FROM shortlist_decisions sd JOIN users u ON u.id = sd.decided_by
       WHERE sd.application_id = ? ORDER BY sd.id DESC`,
    )
    .all(applicationId);
}
