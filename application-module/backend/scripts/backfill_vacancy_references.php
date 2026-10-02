<?php
// CLI: give every existing advertisement without a reference number the next
// number in the series (oldest first).   php scripts/backfill_vacancy_references.php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}
require __DIR__ . '/../init.php';

$t = qi(cfg('vacancies.table'));
$id = qi(cfg('vacancies.id'));
$ref = qi(cfg('vacancies.reference_no'));
$ids = db()->query("SELECT $id FROM $t WHERE $ref IS NULL OR $ref = '' ORDER BY $id")->fetchAll(PDO::FETCH_COLUMN);
foreach ($ids as $vid) {
    echo $vid, ' => ', assign_vacancy_reference(db(), (int) $vid), PHP_EOL;
}
echo count($ids), " advertisement(s) updated.\n";
