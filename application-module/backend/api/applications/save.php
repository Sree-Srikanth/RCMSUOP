<?php
// POST {vacancy_id, selected_job, current_step, form_data} — autosave / "Save Draft".
// Creates the draft (and its reference number) on first save; afterwards updates it.
// Refused once submitted (409 "submitted") or after the closing date (403 "closed").
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('POST');
$user = require_user();

$in = read_json();
$vacancyId = (int) ($in['vacancy_id'] ?? 0);
$form = $in['form_data'] ?? null;
if ($vacancyId <= 0 || !is_array($form)) {
    fail('vacancy_id and form_data are required.');
}
$vacancy = load_vacancy($vacancyId);
if (!$vacancy) {
    fail('Vacancy not found.', 404, 'not_found');
}

$selectedJob = mb_substr(trim((string) ($in['selected_job'] ?? '')), 0, 255);
if ($selectedJob !== '' && $vacancy['positions'] !== '') {
    $allowed = array_map(fn($p) => mb_strtolower(trim($p)), explode(',', $vacancy['positions']));
    if (!in_array(mb_strtolower($selectedJob), $allowed, true)) {
        fail('Selected position is not part of this vacancy.');
    }
}
$step = max(1, min(30, (int) ($in['current_step'] ?? 1)));
$form = sanitize_form_data($form, $user['id']);
$json = json_encode($form, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$p = $form['personalInfo'] ?? [];
$cols = [
    'selected_job'       => $selectedJob,
    'current_step'       => $step,
    'form_data'          => $json,
    'applicant_name'     => mb_substr(trim(($p['title'] ?? '') . ' ' . ($p['fullName'] ?? '')), 0, 255) ?: null,
    'applicant_email'    => mb_substr(trim((string) ($form['contactInfo']['email'] ?? '')), 0, 255) ?: null,
    'nic'                => mb_substr(strtoupper(trim((string) ($p['nic'] ?? ''))), 0, 20) ?: null,
    'declaration_agreed' => to_bool($form['declaration']['agreed'] ?? false) ? 1 : 0,
];

$pdo = db();
for ($attempt = 0; ; $attempt++) {
    $pdo->beginTransaction();
    try {
        $row = find_application($user['id'], $vacancyId, true);
        if ($row && $row['status'] === 'submitted') {
            $pdo->rollBack();
            fail('This application has already been submitted and can no longer be changed.', 409, 'submitted');
        }
        if (!$vacancy['is_open']) {
            $pdo->rollBack();
            fail('The closing date for this vacancy has passed. The application can no longer be edited.', 403, 'closed');
        }
        if ($row) {
            $set = implode(', ', array_map(fn($c) => "$c = ?", array_keys($cols)));
            $pdo->prepare("UPDATE job_applications SET $set WHERE application_id = ?")
                ->execute([...array_values($cols), $row['application_id']]);
            $id = (int) $row['application_id'];
        } else {
            $data = $cols + [
                'reference_no' => next_application_reference($pdo),
                'user_id'      => $user['id'],
                'vacancy_id'   => $vacancyId,
            ];
            $pdo->prepare('INSERT INTO job_applications (' . implode(', ', array_keys($data)) . ') VALUES (' . rtrim(str_repeat('?, ', count($data)), ', ') . ')')
                ->execute(array_values($data));
            $id = (int) $pdo->lastInsertId();
        }
        $pdo->commit();
        break;
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        // Two first-saves raced (e.g. autosave + tab close): retry as an update.
        if ($e->getCode() === '23000' && $attempt < 2) {
            continue;
        }
        throw $e;
    }
}

$st = $pdo->prepare('SELECT application_id, reference_no, updated_at FROM job_applications WHERE application_id = ?');
$st->execute([$id]);
$saved = $st->fetch();
json_out(['success' => true, 'data' => [
    'application_id' => (int) $saved['application_id'],
    'reference_no'   => $saved['reference_no'],
    'updated_at'     => $saved['updated_at'],
]]);
