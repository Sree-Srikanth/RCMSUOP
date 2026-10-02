<?php
// Email templates sent on final submission:
//   • applicant  — confirmation + application PDF
//   • referees   — notification with applicant details + application PDF
declare(strict_types=1);

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function email_layout(string $title, string $inner): string
{
    return '<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:16px 0"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden">'
        . '<tr><td style="background:#800000;color:#ffffff;padding:16px 24px;font-size:18px;font-weight:bold">University of Peradeniya</td></tr>'
        . '<tr><td style="padding:24px;font-size:14px;line-height:1.6">'
        . '<h2 style="margin:0 0 12px;font-size:18px;color:#800000">' . e($title) . '</h2>' . $inner
        . '</td></tr>'
        . '<tr><td style="padding:12px 24px;background:#fafafa;color:#6b7280;font-size:12px">This is an automated message from the University of Peradeniya recruitment portal.</td></tr>'
        . '</table></td></tr></table></body></html>';
}

/** @param array<int, array{0:string, 1:?string}> $rows */
function email_table(array $rows): string
{
    $html = '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0">';
    foreach ($rows as [$k, $v]) {
        if ($v === null || trim($v) === '') {
            continue;
        }
        $html .= '<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;background:#fdf5f5;font-weight:bold;width:40%">' . e($k)
            . '</td><td style="padding:6px 8px;border:1px solid #e5e7eb">' . e($v) . '</td></tr>';
    }
    return $html . '</table>';
}

function applicant_display_name(array $form): string
{
    $p = $form['personalInfo'] ?? [];
    return trim(($p['title'] ?? '') . ' ' . ($p['fullName'] ?? ($p['nameWithInitials'] ?? '')));
}

function post_label(array $vacancy, array $row): string
{
    return $row['selected_job'] ? "{$row['selected_job']} — {$vacancy['title']}" : $vacancy['title'];
}

function current_post(array $form): ?string
{
    foreach ((array) ($form['professionalExperience'] ?? []) as $x) {
        if (to_bool($x['currentPosition'] ?? false)) {
            return trim(($x['designation'] ?? '') . ', ' . ($x['institution'] ?? ''), ', ');
        }
    }
    return null;
}

function applicant_email_html(array $row, array $form, array $vacancy): string
{
    $inner = '<p>Dear ' . e(applicant_display_name($form)) . ',</p>'
        . '<p>Thank you. Your application has been <strong>submitted successfully</strong>. A copy of your application is attached as a PDF.</p>'
        . email_table([
            ['Application Reference No.', $row['reference_no']],
            ['Post', post_label($vacancy, $row)],
            ['Advertisement Reference', $vacancy['reference_no'] ?: null],
            ['Submitted on', $row['submitted_at']],
        ])
        . '<p>Please quote your <strong>Application Reference No.</strong> in all correspondence. Your referees have been notified.</p>'
        . '<p>Originals of all certificates must be produced at the interview.</p>'
        . '<p>Recruitment Division<br>University of Peradeniya</p>';
    return email_layout('Application received', $inner);
}

function referee_email_html(array $referee, array $row, array $form, array $vacancy, bool $withPdf): string
{
    $p = $form['personalInfo'] ?? [];
    $c = $form['contactInfo'] ?? [];
    $inner = '<p>Dear ' . e($referee['name'] ?: 'Sir/Madam') . ',</p>'
        . '<p><strong>' . e(applicant_display_name($form)) . '</strong> has applied for the post of <strong>'
        . e(post_label($vacancy, $row)) . '</strong> at the University of Peradeniya and has named you as a referee.</p>'
        . '<h3 style="margin:16px 0 4px;font-size:15px">Applicant details</h3>'
        . email_table([
            ['Name', applicant_display_name($form)],
            ['Name with initials', $p['nameWithInitials'] ?? null],
            ['Present post', current_post($form)],
            ['Email', $c['email'] ?? null],
            ['Mobile', $c['phoneMobile'] ?? null],
            ['Post applied for', post_label($vacancy, $row)],
            ['Faculty / Department', trim(($vacancy['faculty'] ?? '') . ' / ' . ($vacancy['department'] ?? ''), ' /') ?: null],
            ['Application Reference No.', $row['reference_no']],
            ['Advertisement Reference', $vacancy['reference_no'] ?: null],
        ])
        . ($withPdf ? '<p>A copy of the application is attached for your reference.</p>' : '')
        . '<p>The University may contact you for a confidential report on the applicant. If you do not know the applicant or did not agree to act as a referee, please reply to this email.</p>'
        . '<p>Thank you.<br>Recruitment Division<br>University of Peradeniya</p>';
    return email_layout('Referee notification', $inner);
}

/**
 * Send all submission emails. Never throws; failures are logged and counted.
 * @return array{applicant:bool, referees_sent:int, referees_total:int}
 */
function send_submission_emails(array $row, array $form, array $vacancy, string $pdfAbsPath): array
{
    $pdfName = 'Application_' . preg_replace('/[^A-Za-z0-9-]+/', '-', $row['reference_no']) . '.pdf';
    $pdf = [['path' => $pdfAbsPath, 'name' => $pdfName, 'mime' => 'application/pdf']];
    $name = applicant_display_name($form);

    $applicantEmail = trim((string) ($form['contactInfo']['email'] ?? ''));
    $applicantOk = false;
    if (filter_var($applicantEmail, FILTER_VALIDATE_EMAIL)) {
        $r = send_mail(
            $applicantEmail,
            $name,
            "Application received – {$row['reference_no']} – " . post_label($vacancy, $row),
            applicant_email_html($row, $form, $vacancy),
            $pdf
        );
        $applicantOk = $r['ok'];
    }

    $withPdf = (bool) cfg('mail.attach_pdf_to_referees', true);
    $referees = valid_referees($form);
    $sent = 0;
    $log = db()->prepare('INSERT INTO application_referee_notifications (application_id, referee_name, referee_email, status, error) VALUES (?, ?, ?, ?, ?)');
    foreach ($referees as $ref) {
        $r = send_mail(
            $ref['email'],
            $ref['name'],
            "Referee notification: {$name} – " . post_label($vacancy, $row) . " (Ref. {$row['reference_no']})",
            referee_email_html($ref, $row, $form, $vacancy, $withPdf),
            $withPdf ? $pdf : []
        );
        $sent += $r['ok'] ? 1 : 0;
        $log->execute([$row['application_id'], mb_substr($ref['name'], 0, 255), $ref['email'], $r['ok'] ? 'sent' : 'failed', $r['error']]);
    }

    db()->prepare('UPDATE job_applications SET applicant_email_sent = ? WHERE application_id = ?')
        ->execute([$applicantOk ? 1 : 0, $row['application_id']]);

    return ['applicant' => $applicantOk, 'referees_sent' => $sent, 'referees_total' => count($referees)];
}
