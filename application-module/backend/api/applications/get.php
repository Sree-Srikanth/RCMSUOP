<?php
// GET ?vacancy_id=N — the logged-in user's application (draft or submitted) for a vacancy.
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('GET');
$user = require_user();

$row = find_application($user['id'], (int) ($_GET['vacancy_id'] ?? 0));
json_out(['success' => true, 'data' => $row ? application_payload($row) : null]);
