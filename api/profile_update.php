<?php
declare(strict_types=1);

// --- CORS ---
$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Use POST']);
    exit;
}

require __DIR__ . '/db.php';
$pdo = get_db();

// --- Parse input ---
$in = json_decode(file_get_contents('php://input'), true) ?: [];

$userId      = (int)($in['userId'] ?? 0);
$displayName = isset($in['displayName']) ? trim((string)$in['displayName']) : null;
$bio         = isset($in['bio']) ? trim((string)$in['bio']) : null;

if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing userId']);
  exit;
}

// --- require at least 1 field ---
if ($displayName === null && $bio === null) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Nothing to update']);
    exit;
}

// --- Validate lengths ---
if ($displayName !== null && mb_strlen($displayName) > 80) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'displayName too long']);
    exit;
}
if ($bio !== null && mb_strlen($bio) > 1000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bio too long']);
    exit;
}

// --- Build update ---
$sets = [];
$params = [':id' => $userId];

if ($displayName !== null) {
    $sets[] = 'display_name = :dn';
    $params[':dn'] = $displayName;
}

if ($bio !== null) {
    $sets[] = 'bio = :bio';
    $params[':bio'] = $bio;
}

$sql = "UPDATE users SET " . implode(', ', $sets) . " WHERE id = :id LIMIT 1";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Fetch fresh user data for UI refresh
    $sel = $pdo->prepare("
      SELECT id, display_name, bio, avatar_url, background_path, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    ");
    $sel->execute([$userId]);
    $user = $sel->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
      'ok' => true,
      'user' => $user
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error']);
}
