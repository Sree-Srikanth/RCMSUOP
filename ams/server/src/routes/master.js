import { Router } from 'express';
import { h } from '../lib/util.js';
import { getSetting } from '../db.js';
import { DOC_CATEGORIES, LABELS, RESULT_CLASSES, PG_TYPES, SLQF_LEVELS, AWARD_TYPES, CIVIL_STATUSES, TITLES, SECTIONS } from '../lib/applications.js';

const r = Router();

r.get(
  '/',
  h((req, res) => {
    const { db } = req.ctx;
    const matrix = db
      .prepare(
        `SELECT p.code AS position_code, psd.decision_code, psd.category_code
         FROM position_shortlist_decisions psd JOIN positions p ON p.id = psd.position_id ORDER BY p.sort_order, psd.id`,
      )
      .all();
    res.json({
      faculties: db.prepare('SELECT id, code, name FROM faculties WHERE is_active = 1 ORDER BY name').all(),
      departments: db.prepare('SELECT id, faculty_id, code, name FROM departments WHERE is_active = 1 ORDER BY name').all(),
      positions: db.prepare('SELECT id, code, title FROM positions ORDER BY sort_order').all(),
      provinces: db.prepare('SELECT id, name FROM provinces ORDER BY name').all(),
      districts: db.prepare('SELECT id, province_id, name FROM districts ORDER BY name').all(),
      decision_types: db.prepare('SELECT code, label FROM shortlist_decision_types').all(),
      categories: db.prepare('SELECT code, label FROM shortlist_categories ORDER BY code').all(),
      shortlist_matrix: matrix,
      document_categories: DOC_CATEGORIES,
      labels: LABELS,
      options: { result_classes: RESULT_CLASSES, pg_types: PG_TYPES, slqf_levels: SLQF_LEVELS, award_types: AWARD_TYPES, civil_statuses: CIVIL_STATUSES, titles: TITLES },
      limits: { max_upload_mb: Number(getSetting(db, 'max_upload_mb', '5')) },
      sections: Object.fromEntries(Object.entries(SECTIONS).map(([k, s]) => [k, { label: s.label, single: !!s.single, fixed: s.fixed, cols: s.cols }])),
    });
  }),
);

export default r;
