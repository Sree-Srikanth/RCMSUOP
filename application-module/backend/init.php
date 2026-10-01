<?php
// Side-effect-free setup: config, DB, helpers, auth and all lib functions.
// Safe to require from your existing PHP (e.g. the create-advertisement handler).
declare(strict_types=1);

const APP_MODULE_ROOT = __DIR__;

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'application-module/config.php is missing (copy config.sample.php).']);
    exit;
}
$GLOBALS['APP_CONFIG'] = require $configFile;
date_default_timezone_set(cfg('timezone', 'Asia/Colombo'));

if (is_file(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
}
require_once __DIR__ . '/lib/reference.php';
require_once __DIR__ . '/lib/vacancies.php';
require_once __DIR__ . '/lib/applications.php';
require_once __DIR__ . '/lib/mailer.php';
require_once __DIR__ . '/lib/emails.php';

/** Dot-path config lookup: cfg('mail.smtp.host'). */
function cfg(string $path, $default = null)
{
    $node = $GLOBALS['APP_CONFIG'];
    foreach (explode('.', $path) as $k) {
        if (!is_array($node) || !array_key_exists($k, $node)) {
            return $default;
        }
        $node = $node[$k];
    }
    return $node;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(cfg('db.dsn'), cfg('db.user'), cfg('db.pass'), [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        $pdo->exec("SET time_zone = '" . (new DateTime())->format('P') . "'");
    }
    return $pdo;
}

/** Quote a configured identifier (table/column) — they come from config, never from input. */
function qi(string $name): string
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $name)) {
        throw new RuntimeException("Invalid identifier in config: $name");
    }
    return "`$name`";
}

function json_out(array $body, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $error, int $status = 400, ?string $code = null): void
{
    json_out(array_filter(['success' => false, 'error' => $error, 'code' => $code], fn($v) => $v !== null), $status);
}

function read_json(int $maxBytes = 4_000_000): array
{
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || strlen($raw) > $maxBytes) {
        fail('Request too large.', 413);
    }
    $data = json_decode($raw ?: '[]', true);
    if (!is_array($data)) {
        fail('Invalid JSON body.');
    }
    return $data;
}

function require_method(string ...$methods): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', $methods, true)) {
        fail('Method not allowed.', 405);
    }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/** @return array{id:int, role:string}|null */
function current_user(): ?array
{
    static $user = false;
    if ($user !== false) {
        return $user;
    }
    $user = null;
    $mode = cfg('auth.mode', 'session');
    $usersTable = cfg('auth.users_table', 'users');
    $idCol = cfg('auth.users_id_column', 'id');
    $roleCol = cfg('auth.users_role_column');

    $lookupRole = function (int $id) use ($usersTable, $idCol, $roleCol): string {
        if (!$roleCol) {
            return '';
        }
        try {
            $st = db()->prepare('SELECT ' . qi($roleCol) . ' FROM ' . qi($usersTable) . ' WHERE ' . qi($idCol) . ' = ?');
            $st->execute([$id]);
            return (string) ($st->fetchColumn() ?: '');
        } catch (Throwable $e) {
            return '';
        }
    };

    if ($mode === 'session') {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $id = (int) ($_SESSION[cfg('auth.session_user_key', 'user_id')] ?? 0);
        if ($id > 0) {
            $role = (string) ($_SESSION[cfg('auth.session_role_key', 'role')] ?? $lookupRole($id));
            $user = ['id' => $id, 'role' => $role];
        }
    } elseif ($mode === 'token') {
        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(\S+)$/i', $hdr, $m)) {
            $cols = qi($idCol) . ($roleCol ? ', ' . qi($roleCol) : '');
            $st = db()->prepare("SELECT $cols FROM " . qi($usersTable) . ' WHERE ' . qi(cfg('auth.token_column', 'api_token')) . ' = ? LIMIT 1');
            $st->execute([$m[1]]);
            if ($row = $st->fetch()) {
                $user = ['id' => (int) $row[$idCol], 'role' => (string) ($roleCol ? $row[$roleCol] : '')];
            }
        }
    } elseif ($mode === 'header') {
        // DEVELOPMENT ONLY — anyone can impersonate any user with this mode.
        $id = (int) ($_SERVER['HTTP_X_USER_ID'] ?? 0);
        if ($id > 0) {
            $user = ['id' => $id, 'role' => $lookupRole($id)];
        }
    }
    return $user;
}

function require_user(): array
{
    $u = current_user();
    if (!$u) {
        fail('Please log in to continue.', 401, 'unauthenticated');
    }
    return $u;
}

function require_admin(): array
{
    $u = require_user();
    if (!in_array($u['role'], cfg('auth.admin_roles', []), true)) {
        fail('Administrator access required.', 403, 'forbidden');
    }
    return $u;
}
