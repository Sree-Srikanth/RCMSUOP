<?php
// GET ?q=... (admin) — find advertisements and applications by reference number.
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('GET');
require_admin();

$q = trim((string) ($_GET['q'] ?? ''));
if (mb_strlen($q) < 3) {
    fail('Enter at least 3 characters.');
}
$like = '%' . addcslashes($q, '%_\\') . '%';

$t = qi(cfg('vacancies.table'));
$id = qi(cfg('vacancies.id'));
$ref = qi(cfg('vacancies.reference_no'));
$title = qi(cfg('vacancies.title'));
$closing = cfg('vacancies.closing_date') ? qi(cfg('vacancies.closing_date')) : 'NULL';

$st = db()->prepare("SELECT $id AS vacancy_id, $ref AS reference_no, $title AS title, $closing AS closing_date
                     FROM $t WHERE $ref LIKE ? ORDER BY $ref DESC LIMIT 20");
$st->execute([$like]);
$vacancies = array_map(fn($r) => ['vacancy_id' => (int) $r['vacancy_id']] + $r, $st->fetchAll());

$st = db()->prepare("SELECT a.application_id, a.reference_no, a.applicant_name, a.status, a.submitted_at,
                            v.$title AS vacancy_title, v.$ref AS vacancy_reference_no
                     FROM job_applications a LEFT JOIN $t v ON v.$id = a.vacancy_id
                     WHERE a.reference_no LIKE ? OR v.$ref LIKE ?
                     ORDER BY a.reference_no DESC LIMIT 50");
$st->execute([$like, $like]);
$applications = array_map(fn($r) => ['application_id' => (int) $r['application_id']] + $r, $st->fetchAll());

json_out(['success' => true, 'data' => ['vacancies' => $vacancies, 'applications' => $applications]]);
