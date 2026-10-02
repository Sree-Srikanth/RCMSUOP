<?php
// POST {vacancy_id} (admin) — give an advertisement its reference no. (no-op if it has one).
// Call right after your existing "create advertisement" request succeeds, or call
// assign_vacancy_reference() directly from that PHP handler (see lib/reference.php).
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('POST');
require_admin();

$in = read_json();
$id = (int) ($in['vacancy_id'] ?? 0);
if ($id <= 0 || !load_vacancy($id)) {
    fail('Vacancy not found.', 404, 'not_found');
}
json_out(['success' => true, 'data' => ['vacancy_id' => $id, 'reference_no' => assign_vacancy_reference(db(), $id)]]);
