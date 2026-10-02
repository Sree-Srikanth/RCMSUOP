<?php
// Copy to config.php and adjust. config.php is git-ignored.
return [
    'timezone' => 'Asia/Colombo',

    'db' => [
        'dsn'  => 'mysql:host=localhost;dbname=application_management;charset=utf8mb4',
        'user' => 'root',
        'pass' => '',
    ],

    // Front-end origins allowed to call the API (with cookies / Authorization header).
    'cors_origins' => ['http://localhost:5173', 'http://localhost:3000'],

    // Public URL of the applicant portal (used in emails).
    'portal_url' => 'http://localhost:5173',

    // How to identify the logged-in user — match your existing login.
    //  'session' : PHP session set by your login endpoint ($_SESSION[session_user_key])
    //  'token'   : "Authorization: Bearer <token>" looked up in users.<token_column>
    //  'header'  : trusts the X-User-Id header — LOCAL DEVELOPMENT ONLY, never in production
    'auth' => [
        'mode'             => 'session',
        'session_user_key' => 'user_id',
        'session_role_key' => 'role',
        'users_table'      => 'users',
        'users_id_column'  => 'id',
        'users_role_column'=> 'role',
        'token_column'     => 'api_token',
        'admin_roles'      => ['admin', 'super_admin', 'hr'],
    ],

    // Your existing vacancies table. Set a column to null if it does not exist.
    'vacancies' => [
        'table'         => 'vacancies',
        'id'            => 'vacancy_id',
        'title'         => 'title',
        'positions'     => 'positions',        // comma-separated list of posts
        'faculty'       => 'faculty',
        'department'    => 'department',
        'discipline'    => null,
        'closing_date'  => 'closing_date',     // DATE or DATETIME
        'status'        => 'status',
        'open_statuses' => ['active', 'open', 'published'],
        'reference_no'  => 'reference_no',     // added by sql/001_application_module.sql
    ],

    // Auto-generated reference number series. Tokens: {YYYY} {YY} {N3}..{N8}
    // The counter restarts every year when the format contains {YYYY}/{YY}.
    'reference' => [
        'vacancy_format'     => 'UOP/REC/{YYYY}/{N4}',   // e.g. UOP/REC/2026/0007
        'application_format' => 'APP/{YYYY}/{N6}',       // e.g. APP/2026/000123
    ],

    'files' => [
        // Folder that FILE_BASE_URL (front-end) points at — normally the backend root.
        'public_root' => dirname(__DIR__),
        'upload_dir'  => 'uploads/applications',          // relative to public_root
        'max_upload_mb' => 10,
        'max_pdf_mb'    => 20,
    ],

    'mail' => [
        // 'smtp' (PHPMailer via composer), 'mail' (PHP mail()), or 'log' (.eml files, for testing)
        'transport' => 'smtp',
        'from'      => 'recruitment@pdn.ac.lk',
        'from_name' => 'University of Peradeniya — Recruitment',
        'reply_to'  => 'recruitment@pdn.ac.lk',
        'admin_bcc' => null,                 // e.g. 'establishments@pdn.ac.lk'
        'attach_pdf_to_referees' => true,
        'smtp' => [
            'host'   => 'smtp.gmail.com',
            'port'   => 587,
            'secure' => 'tls',               // 'tls' | 'ssl' | ''
            'user'   => '',
            'pass'   => '',
        ],
        'log_dir' => __DIR__ . '/mail-log',
    ],
];
