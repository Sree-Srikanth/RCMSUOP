<?php
// Application persistence + server-side checks.
declare(strict_types=1);

function find_application(int $userId, int $vacancyId, bool $forUpdate = false): ?array
{
    $st = db()->prepare('SELECT * FROM job_applications WHERE user_id = ? AND vacancy_id = ?' . ($forUpdate ? ' FOR UPDATE' : ''));
    $st->execute([$userId, $vacancyId]);
    return $st->fetch() ?: null;
}

function find_application_by_id(int $applicationId, int $userId, bool $forUpdate = false): ?array
{
    $st = db()->prepare('SELECT * FROM job_applications WHERE application_id = ? AND user_id = ?' . ($forUpdate ? ' FOR UPDATE' : ''));
    $st->execute([$applicationId, $userId]);
    return $st->fetch() ?: null;
}

/** Merge the stored JSON with the row's metadata — the shape the front-end loads. */
function application_payload(array $row): array
{
    $form = json_decode((string) $row['form_data'], true) ?: [];
    return array_merge($form, [
        'application_id'     => (int) $row['application_id'],
        'reference_no'       => $row['reference_no'],
        'vacancy_id'         => (int) $row['vacancy_id'],
        'selectedJob'        => $row['selected_job'],
        'status'             => $row['status'],
        'is_final_submitted' => $row['status'] === 'submitted',
        'current_step'       => (int) $row['current_step'],
        'submitted_at'       => $row['submitted_at'],
        'updated_at'         => $row['updated_at'],
        'pdf_path'           => $row['pdf_path'],
    ]);
}

function user_upload_prefix(int $userId): string
{
    return trim(cfg('files.upload_dir'), '/') . '/' . $userId . '/';
}

/** Coerce truthy strings ("1", "true", "on") — fixes "Declaration Agreed: No". */
function to_bool($v): bool
{
    return $v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'on' || $v === 'yes';
}

/**
 * Clean the client form JSON before storing:
 *  - booleans normalised
 *  - document paths must point inside this user's upload folder
 */
function sanitize_form_data(array $form, int $userId): array
{
    $prefix = user_upload_prefix($userId);
    $okPath = fn($p) => is_string($p) && strpos($p, $prefix) === 0 && strpos($p, '..') === false;

    $docs = [];
    foreach ((array) ($form['documents'] ?? []) as $key => $doc) {
        if (is_string($key) && preg_match('/^[a-z_]+(:[A-Za-z0-9-]{1,64})?$/', $key) && is_array($doc) && $okPath($doc['path'] ?? null)) {
            $docs[$key] = [
                'path'       => $doc['path'],
                'name'       => mb_substr((string) ($doc['name'] ?? ''), 0, 255),
                'uploadedAt' => (string) ($doc['uploadedAt'] ?? ''),
            ];
        }
    }
    $form['documents'] = (object) $docs; // keep {} not [] when empty

    $form['otherDocuments'] = array_values(array_filter(
        (array) ($form['otherDocuments'] ?? []),
        fn($d) => is_array($d) && $okPath($d['path'] ?? null)
    ));

    if (isset($form['declaration']) && is_array($form['declaration'])) {
        foreach (['agreed', 'willingnessToResign'] as $k) {
            $form['declaration'][$k] = to_bool($form['declaration'][$k] ?? false);
        }
        $ed = $form['declaration']['employmentDeclarations'] ?? null;
        if (is_array($ed)) {
            foreach (['hasCommendations', 'hasPunishments', 'hasVacationNotice', 'isBondViolator'] as $k) {
                $ed[$k] = to_bool($ed[$k] ?? false);
            }
            $form['declaration']['employmentDeclarations'] = $ed;
        }
    }
    if (isset($form['contactInfo']) && is_array($form['contactInfo'])) {
        $form['contactInfo']['sameAsPermanent'] = to_bool($form['contactInfo']['sameAsPermanent'] ?? false);
    }
    return $form;
}

/** Essential server-side checks before final submission (mirrors the UI rules). */
function submission_problems(array $form): array
{
    $p = $form['personalInfo'] ?? [];
    $c = $form['contactInfo'] ?? [];
    $problems = [];
    if (trim((string) ($p['fullName'] ?? '')) === '') {
        $problems[] = 'Full name is missing.';
    }
    if (!preg_match('/^(\d{9}[VvXx]|\d{12})$/', trim((string) ($p['nic'] ?? '')))) {
        $problems[] = 'NIC number is missing or invalid.';
    }
    if (!filter_var(trim((string) ($c['email'] ?? '')), FILTER_VALIDATE_EMAIL)) {
        $problems[] = 'Your email address is missing or invalid.';
    }
    $degrees = array_filter((array) ($form['universityEducation'] ?? []), fn($e) => trim((string) ($e['degreeName'] ?? '')) !== '');
    if (!$degrees) {
        $problems[] = 'At least one university qualification is required.';
    }
    $referees = valid_referees($form);
    if (count($referees) < 2) {
        $problems[] = 'Two referees with valid email addresses are required.';
    }
    if (!to_bool($form['declaration']['agreed'] ?? false)) {
        $problems[] = 'The declaration has not been agreed.';
    }
    if (trim((string) ($form['declaration']['signature'] ?? '')) === '') {
        $problems[] = 'The declaration is not signed.';
    }
    return $problems;
}

/** @return array<int, array{name:string, designation:string, institution:string, email:string}> */
function valid_referees(array $form): array
{
    $out = [];
    $seen = [];
    foreach ((array) ($form['referees'] ?? []) as $r) {
        $email = strtolower(trim((string) ($r['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || isset($seen[$email])) {
            continue;
        }
        $seen[$email] = true;
        $out[] = [
            'name'        => trim((string) ($r['name'] ?? '')),
            'designation' => trim((string) ($r['designation'] ?? '')),
            'institution' => trim((string) ($r['institution'] ?? '')),
            'email'       => $email,
        ];
    }
    return $out;
}

/** Absolute filesystem path for a stored relative path. */
function public_path(string $relative): string
{
    return rtrim(cfg('files.public_root'), '/') . '/' . ltrim($relative, '/');
}

function ensure_upload_dir(string $relativeDir): string
{
    $abs = public_path($relativeDir);
    if (!is_dir($abs) && !mkdir($abs, 0775, true) && !is_dir($abs)) {
        throw new RuntimeException("Cannot create upload directory $relativeDir");
    }
    // Never execute anything uploaded.
    $root = public_path(trim(cfg('files.upload_dir'), '/'));
    $ht = "$root/.htaccess";
    if (!is_file($ht)) {
        @file_put_contents($ht, "<FilesMatch \"\\.(php\\d?|phtml|phar|pl|py|cgi|sh)$\">\n  Require all denied\n</FilesMatch>\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\n");
    }
    return $abs;
}
