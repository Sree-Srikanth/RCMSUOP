<?php
// GET (admin) — preview the next advertisement reference no. for the "New Advertisement" form.
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('GET');
require_admin();

json_out(['success' => true, 'data' => ['reference_no' => peek_vacancy_reference(db())]]);
