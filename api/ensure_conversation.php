<?php
declare(strict_types=1);

header('Content-Type: application/json');

$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';

header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Use POST']);
  exit;
}

require __DIR__ . '/db.php';
$pdo = get_db();

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$me   = (int)($in['me'] ?? 0);
$peer = (int)($in['peer_id'] ?? 0);

if ($me <= 0 || $peer <= 0) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'me and peer_id required']);
  exit;
}

if ($me === $peer) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'cannot_message_self']);
  exit;
}

try {
  // Find existing conversation with EXACTLY these 2 participants
  $sql = "
    SELECT c.id
    FROM conversations c
    JOIN conversation_participants p1 
      ON p1.conversation_id = c.id AND p1.user_id = ?
    JOIN conversation_participants p2 
      ON p2.conversation_id = c.id AND p2.user_id = ?
    GROUP BY c.id
    HAVING COUNT(*) = 2
    LIMIT 1
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([$me, $peer]);
  $existing = $stmt->fetchColumn();

  if ($existing) {
    echo json_encode(['ok'=>true, 'conversation_id'=>(int)$existing]);
    exit;
  }

  // No convo → create one
  $pdo->beginTransaction();

  $pdo->exec("INSERT INTO conversations DEFAULT VALUES");
  $cid = (int)$pdo->lastInsertId();

  $add = $pdo->prepare("
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (?, ?)
  ");
  $add->execute([$cid, $me]);
  $add->execute([$cid, $peer]);

  $pdo->commit();

  echo json_encode(['ok'=>true,'conversation_id'=>$cid]);

} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
