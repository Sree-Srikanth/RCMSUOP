<?php
// Bootstrap for the module's HTTP endpoints: init + CORS + JSON error handler.
declare(strict_types=1);

require_once __DIR__ . '/init.php';

// ─── CORS ────────────────────────────────────────────────────────────────────
(function () {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, cfg('cors_origins', []), true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
})();

set_exception_handler(function (Throwable $e) {
    error_log('[application-module] ' . $e);
    fail('Server error. Please try again.', 500, 'server_error');
});
