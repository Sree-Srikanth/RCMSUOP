<?php
// POST multipart {application_id, pdf} — final submission.
//  1. checks ownership, closing date, not already submitted, essential fields
//  2. stores the application PDF and locks the application
//  3. emails the applicant (with PDF) and every referee (details + PDF)
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('POST');
$user = require_user();

$applicationId = (int) ($_POST['application_id'] ?? 0);
$pdf = $_FILES['pdf'] ?? null;
if ($applicationId <= 0) {
    fail('application_id is required.');
}
if (!$pdf || ($pdf['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail('The application PDF was not received.');
}
if ($pdf['size'] > (int) cfg('files.max_pdf_mb', 20) * 1024 * 1024) {
    fail('The application PDF is too large.');
}
$head = (string) file_get_contents($pdf['tmp_name'], false, null, 0, 5);
if ($head !== '%PDF-' || (new finfo(FILEINFO_MIME_TYPE))->file($pdf['tmp_name']) !== 'application/pdf') {
    fail('Invalid PDF file.');
}

$pdo = db();
$pdo->beginTransaction();
$row = find_application_by_id($applicationId, $user['id'], true);
if (!$row) {
    $pdo->rollBack();
    fail('Application not found.', 404, 'not_found');
}
if ($row['status'] === 'submitted') {
    $pdo->rollBack();
    fail('This application has already been submitted.', 409, 'submitted');
}
$vacancy = load_vacancy((int) $row['vacancy_id']);
if (!$vacancy || !$vacancy['is_open']) {
    $pdo->rollBack();
    fail('The closing date for this vacancy has passed. The application cannot be submitted.', 403, 'closed');
}
$form = json_decode((string) $row['form_data'], true) ?: [];
$problems = submission_problems($form);
if ($problems) {
    $pdo->rollBack();
    json_out(['success' => false, 'code' => 'incomplete', 'error' => 'Application incomplete: ' . implode(' ', $problems), 'problems' => $problems], 422);
}

$relDir = trim(cfg('files.upload_dir'), '/') . "/{$user['id']}/{$row['vacancy_id']}";
$absDir = ensure_upload_dir($relDir);
$pdfName = 'application_' . preg_replace('/[^A-Za-z0-9-]+/', '-', $row['reference_no']) . '.pdf';
if (!move_uploaded_file($pdf['tmp_name'], "$absDir/$pdfName")) {
    $pdo->rollBack();
    fail('Could not store the application PDF.', 500);
}
$pdo->prepare("UPDATE job_applications SET status = 'submitted', submitted_at = NOW(), pdf_path = ? WHERE application_id = ?")
    ->execute(["$relDir/$pdfName", $applicationId]);
$pdo->commit();

$st = $pdo->prepare('SELECT * FROM job_applications WHERE application_id = ?');
$st->execute([$applicationId]);
$row = $st->fetch();

// Emails go out after commit: a mail failure must never undo a valid submission.
$emails = send_submission_emails($row, $form, $vacancy, "$absDir/$pdfName");

json_out(['success' => true, 'data' => [
    'reference_no' => $row['reference_no'],
    'submitted_at' => $row['submitted_at'],
    'pdf_path'     => $row['pdf_path'],
    'emails'       => $emails,
]]);
