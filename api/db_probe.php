<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

try {
  require __DIR__ . '/db.php';
  $pdo = get_db();

  $ver = $pdo->query("SELECT VERSION() AS v")->fetch()['v'] ?? 'unknown';

  $tables = [];
  $stmt = $pdo->query("SHOW TABLES");
  while ($row = $stmt->fetch(PDO::FETCH_NUM)) $tables[] = $row[0];

  $dogsCount = null;
  if (in_array('dogs', $tables, true)) {
    $dogsCount = (int)$pdo->query("SELECT COUNT(*) FROM dogs")->fetchColumn();
  }

  echo json_encode(['ok'=>true,'mysql_version'=>$ver,'tables'=>$tables,'dogs_count'=>$dogsCount]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
