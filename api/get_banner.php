<?php
declare(strict_types=1);

header('Content-Type: application/json');

$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/db.php';

$user_id = (int)($_GET['user_id'] ?? 0);
if ($user_id <= 0) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error'=> 'Missing or invalid user_id']);
  exit;
}

try {
  $pdo = get_db();
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $stmt = $pdo->prepare('SELECT background_path FROM users WHERE id = ? LIMIT 1');
  $stmt->execute([$user_id]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  echo json_encode([
    'success' => true,
    'background_path' => $row['background_path'] ?? null
  ]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'server_error']);
}
