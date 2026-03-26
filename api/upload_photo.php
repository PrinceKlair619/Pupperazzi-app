<?php
declare(strict_types=1);

header('Content-Type: application/json');

$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/db.php';
$pdo = get_db();

/* ---------------- Validate ---------------- */
$user_id = (int)($_POST['user_id'] ?? 0);
if ($user_id <= 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing user_id']);
  exit;
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'No file uploaded']);
  exit;
}

/* ---------------- Determine environment ---------------- */
$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = str_contains($host, 'localhost');

$upload_dir = $isLocal
  ? 'C:/xampp/htdocs/pupperazzi-api/uploads/'
  : dirname(__DIR__) . '/uploads/';

$public_path = $isLocal
  ? '/pupperazzi-api/uploads/'
  : '/CSE442/2025-Fall/cse-442ac/uploads/';

if (!is_dir($upload_dir)) {
  mkdir($upload_dir, 0775, true);
}

/* ---------------- Save file ---------------- */
$filename = uniqid('avatar_', true) . '_' . basename($_FILES['photo']['name']);
$target_path = $upload_dir . $filename;
$relative_url = $public_path . $filename;

if (!move_uploaded_file($_FILES['photo']['tmp_name'], $target_path)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'File move failed']);
  exit;
}

/* ---------------- Update DB (AVATAR!) ---------------- */
$stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
$stmt->execute([$relative_url, $user_id]);

echo json_encode([
  'ok' => true,
  'avatar_url' => $relative_url
]);
