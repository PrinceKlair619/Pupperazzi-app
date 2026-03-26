<?php
declare(strict_types=1);

header('Content-Type: application/json');

// CORS
$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';

header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Use POST']);
  exit;
}

require __DIR__ . '/db.php';
$pdo = get_db();

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$user_id = (int)($in['user_id'] ?? 0);
$with_user_id = (int)($in['with_user_id'] ?? 0);

if ($user_id <= 0 || $with_user_id <= 0) {
  echo json_encode(['ok'=>false,'error'=>'Missing user_id or with_user_id']);
  exit;
}

if ($user_id === $with_user_id) {
  echo json_encode(['ok'=>false,'error'=>'Cannot message yourself']);
  exit;
}

try {
  // Check if conversation exists
  $sql = "
    SELECT c.id
    FROM conversations c
    JOIN conversation_participants p1 
      ON p1.conversation_id = c.id AND p1.user_id = :u1
    JOIN conversation_participants p2 
      ON p2.conversation_id = c.id AND p2.user_id = :u2
    LIMIT 1
  ";

  $check = $pdo->prepare($sql);
  $check->execute([':u1' => $user_id, ':u2' => $with_user_id]);
  $existing = $check->fetchColumn();

  if ($existing) {
    echo json_encode(['ok' => true, 'conversation_id' => (int)$existing]);
    exit;
  }

  // Create new conversation
  $pdo->beginTransaction();

  $pdo->exec("INSERT INTO conversations () VALUES ()");
  $cid = (int)$pdo->lastInsertId();

  $stmt = $pdo->prepare("
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (:cid, :uid)
  ");
  $stmt->execute([':cid' => $cid, ':uid' => $user_id]);
  $stmt->execute([':cid' => $cid, ':uid' => $with_user_id]);

  $pdo->commit();

  echo json_encode(['ok' => true, 'conversation_id' => $cid]);
  exit;

} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'server_error',
    'detail' => $e->getMessage()
  ]);
  exit;
}
