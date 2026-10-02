<?php
// Minimal mail wrapper.
//   transport 'smtp' → PHPMailer (composer require phpmailer/phpmailer)
//   transport 'mail' → PHP mail() with a hand-built MIME message
//   transport 'log'  → writes .eml files to mail.log_dir (testing)
declare(strict_types=1);

/**
 * @param array<int, array{path:string, name:string, mime?:string}> $attachments
 * @return array{ok:bool, error:?string}
 */
function send_mail(string $toEmail, string $toName, string $subject, string $html, array $attachments = []): array
{
    $transport = cfg('mail.transport', 'smtp');
    $text = html_to_text($html);
    try {
        if ($transport === 'smtp') {
            if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
                return ['ok' => false, 'error' => 'PHPMailer not installed — run: composer require phpmailer/phpmailer'];
            }
            $m = new \PHPMailer\PHPMailer\PHPMailer(true);
            $m->isSMTP();
            $m->Host = cfg('mail.smtp.host');
            $m->Port = (int) cfg('mail.smtp.port', 587);
            $secure = cfg('mail.smtp.secure', 'tls');
            if ($secure) {
                $m->SMTPSecure = $secure;
            }
            if (cfg('mail.smtp.user')) {
                $m->SMTPAuth = true;
                $m->Username = cfg('mail.smtp.user');
                $m->Password = cfg('mail.smtp.pass');
            }
            $m->CharSet = 'UTF-8';
            $m->setFrom(cfg('mail.from'), cfg('mail.from_name', ''));
            if (cfg('mail.reply_to')) {
                $m->addReplyTo(cfg('mail.reply_to'));
            }
            if (cfg('mail.admin_bcc')) {
                $m->addBCC(cfg('mail.admin_bcc'));
            }
            $m->addAddress($toEmail, $toName);
            $m->Subject = $subject;
            $m->isHTML(true);
            $m->Body = $html;
            $m->AltBody = $text;
            foreach ($attachments as $a) {
                $m->addAttachment($a['path'], $a['name'], 'base64', $a['mime'] ?? 'application/octet-stream');
            }
            $m->send();
            return ['ok' => true, 'error' => null];
        }

        [$headers, $body] = build_mime(cfg('mail.from'), cfg('mail.from_name', ''), $toEmail, $toName, $text, $html, $attachments);

        if ($transport === 'log') {
            $dir = cfg('mail.log_dir', APP_MODULE_ROOT . '/mail-log');
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
            $file = sprintf('%s/%s_%s.eml', $dir, date('Ymd_His'), substr(sha1($toEmail . $subject . microtime()), 0, 8));
            file_put_contents($file, "To: " . encode_address($toEmail, $toName) . "\r\nSubject: " . encode_header($subject) . "\r\n" . $headers . "\r\n\r\n" . $body);
            return ['ok' => true, 'error' => null];
        }

        $ok = mail(encode_address($toEmail, $toName), encode_header($subject), $body, $headers);
        return ['ok' => $ok, 'error' => $ok ? null : 'mail() returned false'];
    } catch (Throwable $e) {
        error_log('[application-module] mail to ' . $toEmail . ' failed: ' . $e->getMessage());
        return ['ok' => false, 'error' => mb_substr($e->getMessage(), 0, 480)];
    }
}

function encode_header(string $s): string
{
    return preg_match('/[^\x20-\x7E]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s;
}

function encode_address(string $email, string $name): string
{
    $name = trim(str_replace(["\r", "\n", '"'], '', $name));
    return $name === '' ? $email : encode_header($name) . " <$email>";
}

/** @return array{0:string, 1:string} headers, body */
function build_mime(string $from, string $fromName, string $to, string $toName, string $text, string $html, array $attachments): array
{
    $mixed = 'mixed_' . bin2hex(random_bytes(8));
    $alt = 'alt_' . bin2hex(random_bytes(8));
    $h = [
        'From: ' . encode_address($from, $fromName),
        'MIME-Version: 1.0',
        "Content-Type: multipart/mixed; boundary=\"$mixed\"",
    ];
    if (cfg('mail.reply_to')) {
        $h[] = 'Reply-To: ' . cfg('mail.reply_to');
    }
    if (cfg('mail.admin_bcc')) {
        $h[] = 'Bcc: ' . cfg('mail.admin_bcc');
    }
    $b = "--$mixed\r\nContent-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n"
        . "--$alt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text)) . "\r\n"
        . "--$alt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html)) . "\r\n--$alt--\r\n";
    foreach ($attachments as $a) {
        $name = str_replace(['"', "\r", "\n"], '', $a['name']);
        $b .= "--$mixed\r\nContent-Type: " . ($a['mime'] ?? 'application/octet-stream') . "; name=\"$name\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$name\"\r\n\r\n"
            . chunk_split(base64_encode((string) file_get_contents($a['path']))) . "\r\n";
    }
    $b .= "--$mixed--\r\n";
    return [implode("\r\n", $h), $b];
}

function html_to_text(string $html): string
{
    $t = preg_replace('/<\/td>\s*<td[^>]*>/i', ': ', $html);
    $t = preg_replace(['/<br\s*\/?>/i', '/<\/(p|div|tr|h\d|li)>/i'], "\n", (string) $t);
    $t = html_entity_decode(strip_tags((string) $t), ENT_QUOTES, 'UTF-8');
    return trim(preg_replace("/\n{3,}/", "\n\n", preg_replace('/[ \t]+/', ' ', $t)));
}
