<?php
header('Content-Type: application/json');
require __DIR__ . '/db.php';
$ver = $pdo->query("SELECT VERSION() AS v")->fetch()['v'] ?? 'unknown';
echo json_encode(['ok' => true, 'mysql' => $ver]);
