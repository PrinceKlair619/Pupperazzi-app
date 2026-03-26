<?php
declare(strict_types=1);
header('Content-Type: application/json');

$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/db.php';
$pdo = get_db();

/* Accept both ?userId= and ?user_id= */
$userId = 0;
if (isset($_GET['userId']))  $userId = (int)$_GET['userId'];
if (isset($_GET['user_id'])) $userId = (int)$_GET['user_id'];

if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing or invalid userId']);
  exit;
}

/* Fetch user */
$stmt = $pdo->prepare("
  SELECT id, display_name, bio, avatar_url, background_path, created_at
  FROM users
  WHERE id = ?
  LIMIT 1
");
$stmt->execute([$userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  http_response_code(404);
  echo json_encode(['ok' => false, 'error' => 'User not found']);
  exit;
}

/* Final output shape */
echo json_encode([
  'ok' => true,
  'user' => [
    'id'              => (int)$row['id'],
    'display_name'    => $row['display_name'],
    'bio'             => $row['bio'],
    'avatar_url'      => $row['avatar_url'],      // front-end expects this
    'background_path' => $row['background_path'], // front-end expects this
    'created_at'      => $row['created_at'],
  ],
]);
