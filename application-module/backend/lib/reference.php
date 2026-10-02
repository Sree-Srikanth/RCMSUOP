<?php
// Auto reference numbers — a series of numbers that admins can search later.
// Format tokens: {YYYY} {YY} {N3}…{N8}. Counters are atomic (safe when two
// admins create advertisements at the same moment) and, when a series is
// first used, are seeded from the highest number already in the table so
// the series continues from existing manual references.
declare(strict_types=1);

/** @return array{prefix:string, width:int, suffix:string, series:string} */
function reference_parts(string $format, string $seriesName, ?DateTimeInterface $at = null): array
{
    $at = $at ?? new DateTimeImmutable();
    $resolved = strtr($format, ['{YYYY}' => $at->format('Y'), '{YY}' => $at->format('y')]);
    if (!preg_match('/\{N([3-8])\}/', $resolved, $m, PREG_OFFSET_CAPTURE)) {
        throw new RuntimeException("Reference format needs a {N4}-style counter token: $format");
    }
    $prefix = substr($resolved, 0, $m[0][1]);
    $suffix = substr($resolved, $m[0][1] + strlen($m[0][0]));
    $yearScoped = strpos($format, '{YYYY}') !== false || strpos($format, '{YY}') !== false;
    return [
        'prefix' => $prefix,
        'width'  => (int) $m[1][0],
        'suffix' => $suffix,
        'series' => $seriesName . ($yearScoped ? ':' . $at->format('Y') : ''),
    ];
}

function format_reference(array $parts, int $n): string
{
    return $parts['prefix'] . str_pad((string) $n, $parts['width'], '0', STR_PAD_LEFT) . $parts['suffix'];
}

/** Highest counter already used in $table.$column for this prefix (0 if none). */
function reference_max_existing(PDO $pdo, array $parts, string $table, string $column): int
{
    $st = $pdo->prepare('SELECT ' . qi($column) . ' FROM ' . qi($table) . ' WHERE ' . qi($column) . ' LIKE ?');
    $st->execute([addcslashes($parts['prefix'], '%_\\') . '%']);
    $max = 0;
    $re = '/^' . preg_quote($parts['prefix'], '/') . '(\d+)' . preg_quote($parts['suffix'], '/') . '$/';
    foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $ref) {
        if (preg_match($re, (string) $ref, $m)) {
            $max = max($max, (int) $m[1]);
        }
    }
    return $max;
}

function ensure_series_seeded(PDO $pdo, array $parts, string $table, string $column): void
{
    $st = $pdo->prepare('SELECT 1 FROM reference_sequences WHERE series = ?');
    $st->execute([$parts['series']]);
    if ($st->fetchColumn()) {
        return;
    }
    $seed = reference_max_existing($pdo, $parts, $table, $column);
    $pdo->prepare('INSERT IGNORE INTO reference_sequences (series, last_value) VALUES (?, ?)')
        ->execute([$parts['series'], $seed]);
}

/** Atomically take the next number in the series. */
function next_reference(PDO $pdo, string $format, string $seriesName, string $table, string $column): string
{
    $parts = reference_parts($format, $seriesName);
    ensure_series_seeded($pdo, $parts, $table, $column);
    // LAST_INSERT_ID(expr) makes the increment + read atomic per connection.
    $pdo->prepare('UPDATE reference_sequences SET last_value = LAST_INSERT_ID(last_value + 1) WHERE series = ?')
        ->execute([$parts['series']]);
    $n = (int) $pdo->query('SELECT LAST_INSERT_ID()')->fetchColumn();
    return format_reference($parts, $n);
}

/** What the next number WILL be (display only — not reserved). */
function peek_reference(PDO $pdo, string $format, string $seriesName, string $table, string $column): string
{
    $parts = reference_parts($format, $seriesName);
    $st = $pdo->prepare('SELECT last_value FROM reference_sequences WHERE series = ?');
    $st->execute([$parts['series']]);
    $last = $st->fetchColumn();
    if ($last === false) {
        $last = reference_max_existing($pdo, $parts, $table, $column);
    }
    return format_reference($parts, (int) $last + 1);
}

// ─── convenience wrappers ────────────────────────────────────────────────────

function next_application_reference(PDO $pdo): string
{
    return next_reference($pdo, cfg('reference.application_format'), 'application', 'job_applications', 'reference_no');
}

function peek_vacancy_reference(PDO $pdo): string
{
    return peek_reference($pdo, cfg('reference.vacancy_format'), 'vacancy', cfg('vacancies.table'), cfg('vacancies.reference_no'));
}

/**
 * Give a vacancy its reference number if it has none. Call this from your
 * existing "create advertisement" handler right after the INSERT:
 *
 *   require_once __DIR__ . '/application-module/init.php';
 *   $ref = assign_vacancy_reference($pdo, $newVacancyId);
 */
function assign_vacancy_reference(PDO $pdo, int $vacancyId): string
{
    $t = qi(cfg('vacancies.table'));
    $id = qi(cfg('vacancies.id'));
    $col = qi(cfg('vacancies.reference_no'));

    $st = $pdo->prepare("SELECT $col FROM $t WHERE $id = ?");
    $st->execute([$vacancyId]);
    $existing = $st->fetchColumn();
    if ($existing === false) {
        throw new RuntimeException("Vacancy $vacancyId not found");
    }
    if ($existing) {
        return (string) $existing;
    }
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $ref = next_reference($pdo, cfg('reference.vacancy_format'), 'vacancy', cfg('vacancies.table'), cfg('vacancies.reference_no'));
        try {
            $upd = $pdo->prepare("UPDATE $t SET $col = ? WHERE $id = ? AND ($col IS NULL OR $col = '')");
            $upd->execute([$ref, $vacancyId]);
            if ($upd->rowCount() === 1) {
                return $ref;
            }
            $st->execute([$vacancyId]); // someone else assigned it concurrently
            return (string) $st->fetchColumn();
        } catch (PDOException $e) {
            if ($e->getCode() !== '23000') {
                throw $e; // only retry on a duplicate (manually-entered clash)
            }
        }
    }
    throw new RuntimeException('Could not allocate a unique vacancy reference number');
}
