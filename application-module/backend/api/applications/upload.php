<?php
// POST multipart {file, document_key, vacancy_id} — upload one supporting document.
// Returns {path, name}; the front-end stores it in form_data.documents[document_key].
declare(strict_types=1);
require __DIR__ . '/../../bootstrap.php';
require_method('POST');
$user = require_user();

$vacancyId = (int) ($_POST['vacancy_id'] ?? 0);
$key = (string) ($_POST['document_key'] ?? '');
if (!preg_match('/^(other|[a-z_]+(:[A-Za-z0-9-]{1,64})?)$/', $key)) {
    fail('Invalid document type.');
}
$vacancy = load_vacancy($vacancyId);
if (!$vacancy) {
    fail('Vacancy not found.', 404, 'not_found');
}
$app = find_application($user['id'], $vacancyId);
if ($app && $app['status'] === 'submitted') {
    fail('This application has already been submitted.', 409, 'submitted');
}
if (!$vacancy['is_open']) {
    fail('The closing date for this vacancy has passed.', 403, 'closed');
}

$f = $_FILES['file'] ?? null;
if (!$f || !is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $err = $f['error'] ?? UPLOAD_ERR_NO_FILE;
    fail(in_array($err, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 'File is too large.' : 'No file received.', 400);
}
$maxBytes = (int) cfg('files.max_upload_mb', 10) * 1024 * 1024;
if ($f['size'] <= 0 || $f['size'] > $maxBytes) {
    fail('File must be smaller than ' . cfg('files.max_upload_mb', 10) . ' MB.');
}

$type = explode(':', $key)[0];
$allowedExt = match (true) {
    $type === 'profile_photo'                              => ['jpg', 'jpeg', 'png'],
    in_array($type, ['book', 'journal', 'conference'], true) => ['pdf'],
    $type === 'other'                                      => ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    default                                                => ['pdf', 'jpg', 'jpeg', 'png'],
};
$mimeByExt = [
    'pdf'  => ['application/pdf'],
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png'  => ['image/png'],
    'doc'  => ['application/msword', 'application/octet-stream', 'application/CDFV2'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
];
$original = basename(str_replace('\\', '/', (string) $f['name']));
$ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExt, true)) {
    fail('Allowed file types: ' . strtoupper(implode(', ', $allowedExt)) . '.');
}
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: '';
if (!in_array($mime, $mimeByExt[$ext], true)) {
    fail('The file content does not match its extension.');
}

$relDir = trim(cfg('files.upload_dir'), '/') . "/{$user['id']}/$vacancyId";
$absDir = ensure_upload_dir($relDir);
$safeKey = preg_replace('/[^a-z0-9]+/i', '-', $key);
$fileName = $safeKey . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
if (!move_uploaded_file($f['tmp_name'], "$absDir/$fileName")) {
    fail('Could not store the file. Please try again.', 500);
}

json_out(['success' => true, 'data' => [
    'path' => "$relDir/$fileName",
    'name' => mb_substr($original, 0, 255),
]]);
