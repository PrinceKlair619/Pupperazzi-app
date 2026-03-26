<?php
declare(strict_types=1);

/* CORS + JSON headers */
header('Content-Type: application/json');
$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-cache, no-store, must-revalidate');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

echo json_encode(['ok' => true, 'msg' => 'PHP alive']);
