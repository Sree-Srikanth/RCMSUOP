<?php
// Read-only access to the existing vacancies table (column names from config).
declare(strict_types=1);

/**
 * @return array{vacancy_id:int, reference_no:string, title:string, positions:string,
 *   faculty:?string, department:?string, discipline:?string, closing_date:?string, is_open:bool}|null
 */
function load_vacancy(int $vacancyId): ?array
{
    $map = [
        'vacancy_id'   => cfg('vacancies.id'),
        'reference_no' => cfg('vacancies.reference_no'),
        'title'        => cfg('vacancies.title'),
        'positions'    => cfg('vacancies.positions'),
        'faculty'      => cfg('vacancies.faculty'),
        'department'   => cfg('vacancies.department'),
        'discipline'   => cfg('vacancies.discipline'),
        'closing_date' => cfg('vacancies.closing_date'),
        'status'       => cfg('vacancies.status'),
    ];
    $select = [];
    foreach ($map as $alias => $col) {
        $select[] = $col ? qi($col) . " AS `$alias`" : "NULL AS `$alias`";
    }
    $st = db()->prepare('SELECT ' . implode(', ', $select) . ' FROM ' . qi(cfg('vacancies.table')) . ' WHERE ' . qi(cfg('vacancies.id')) . ' = ? LIMIT 1');
    $st->execute([$vacancyId]);
    $row = $st->fetch();
    if (!$row) {
        return null;
    }
    return [
        'vacancy_id'   => (int) $row['vacancy_id'],
        'reference_no' => (string) ($row['reference_no'] ?? ''),
        'title'        => (string) ($row['title'] ?? ''),
        'positions'    => (string) ($row['positions'] ?? ''),
        'faculty'      => $row['faculty'] !== null ? (string) $row['faculty'] : null,
        'department'   => $row['department'] !== null ? (string) $row['department'] : null,
        'discipline'   => $row['discipline'] !== null ? (string) $row['discipline'] : null,
        'closing_date' => $row['closing_date'] ? substr((string) $row['closing_date'], 0, 10) : null,
        'is_open'      => vacancy_row_is_open($row),
    ];
}

/** Open = status is an "open" status (if that column exists) AND closing date not passed. */
function vacancy_row_is_open(array $row): bool
{
    if (cfg('vacancies.status') && $row['status'] !== null) {
        $open = array_map('strtolower', cfg('vacancies.open_statuses', []));
        if (!in_array(strtolower((string) $row['status']), $open, true)) {
            return false;
        }
    }
    $closing = (string) ($row['closing_date'] ?? '');
    if ($closing === '' || strpos($closing, '0000-00-00') === 0) {
        return true;
    }
    // DATE → open through the end of that day; DATETIME → open until that moment.
    $deadline = strlen($closing) <= 10 ? "$closing 23:59:59" : $closing;
    return new DateTimeImmutable() <= new DateTimeImmutable($deadline);
}
