<?php
// GET ?vacancy_id=N  (public) — is this vacancy accepting applications?
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('GET');

$vacancy = load_vacancy((int) ($_GET['vacancy_id'] ?? 0));
if (!$vacancy) {
    fail('This vacancy could not be found.', 404, 'not_found');
}
json_out(['success' => true, 'data' => $vacancy]);
