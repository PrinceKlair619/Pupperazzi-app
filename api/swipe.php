<?php
// api/swipe.php
declare(strict_types=1);
header('Content-Type: application/json');

// CORS
$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu'
  : 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require __DIR__ . '/db.php';
$pdo = get_db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Use POST']); exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$user_id = (int)($in['user_id'] ?? 0);   // swiper (human)
$dog_id  = (int)($in['dog_id']  ?? 0);   // target dog (belongs to other user)
$action  = strtolower(trim((string)($in['action'] ?? '')));

if ($user_id <= 0 || $dog_id <= 0 || $action === '') {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'user_id, dog_id, action required']); exit;
}
if (!in_array($action, ['like','star','dislike'], true)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'invalid action']); exit;
}

try {
  $pdo->beginTransaction();

  // Get the dog & its owner
  $qDog = $pdo->prepare("SELECT id, user_id, name, photo_url FROM dogs WHERE id = :d LIMIT 1");
  $qDog->execute([':d'=>$dog_id]);
  $dog = $qDog->fetch(PDO::FETCH_ASSOC);
  if (!$dog) { $pdo->rollBack(); http_response_code(404); echo json_encode(['ok'=>false,'error'=>'Dog not found']); exit; }
  $other_user = (int)$dog['user_id'];
  if ($other_user === $user_id) {
    $pdo->rollBack(); http_response_code(409); echo json_encode(['ok'=>false,'error'=>'Cannot swipe on your own dog']); exit;
  }

  // Upsert this swipe (requires UNIQUE KEY (user_id,dog_id) )
  $up = $pdo->prepare("
    INSERT INTO swipes (user_id, dog_id, action)
    VALUES (:u, :d, :a)
    ON DUPLICATE KEY UPDATE action = VALUES(action), created_at = created_at
  ");
  $up->execute([':u'=>$user_id, ':d'=>$dog_id, ':a'=>$action]);

  $is_match = false;
  $match_id = null;
  $conv_id  = null;

  // Only match on positive intent
  if (in_array($action, ['like','star'], true)) {
    // Did the OTHER user already like ANY of MY dogs?
    $theyLikeMine = $pdo->prepare("
      SELECT s.dog_id
      FROM swipes s
      JOIN dogs d ON d.id = s.dog_id
      WHERE s.user_id = :other
        AND d.user_id = :me
        AND s.action IN ('like','star')
      ORDER BY s.created_at DESC
      LIMIT 1
    ");
    $theyLikeMine->execute([':other'=>$other_user, ':me'=>$user_id]);
    $myDogTheyLiked = (int)($theyLikeMine->fetchColumn() ?: 0);

    if ($myDogTheyLiked > 0) {
      $is_match = true;

      // Order the pair deterministically so we have ONE row per pair
      $a = min($user_id, $other_user);
      $b = max($user_id, $other_user);

      // dog_a must belong to user_a; dog_b must belong to user_b
      // Current swipe: $user_id liked $dog_id (which belongs to $other_user)
      // Other user's positive swipe: they liked $myDogTheyLiked (which belongs to $user_id)
      $dog_a = ($a === $user_id) ? $myDogTheyLiked : $dog_id; // dog owned by user_a
      $dog_b = ($b === $user_id) ? $myDogTheyLiked : $dog_id; // dog owned by user_b

      // Create/complete the match row idempotently.
      // Requires UNIQUE KEY (user_a,user_b) on matches.
      $ins = $pdo->prepare("
        INSERT INTO matches (user_a, user_b, dog_a, dog_b, created_at, updated_at)
        VALUES (:a, :b, :da, :db, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          dog_a = COALESCE(matches.dog_a, VALUES(dog_a)),
          dog_b = COALESCE(matches.dog_b, VALUES(dog_b)),
          updated_at = CURRENT_TIMESTAMP
      ");
      $ins->execute([':a'=>$a, ':b'=>$b, ':da'=>$dog_a ?: null, ':db'=>$dog_b ?: null]);

      // Fetch id (works both for insert and duplicate)
      $selM = $pdo->prepare("SELECT id FROM matches WHERE user_a = :a AND user_b = :b LIMIT 1");
      $selM->execute([':a'=>$a, ':b'=>$b]);
      $match_id = (int)$selM->fetchColumn();

      // Optional: bootstrap a conversation (idempotent)
      try {
        $selC = $pdo->prepare("
          SELECT c.id
          FROM conversations c
          JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = :a
          JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = :b
          LIMIT 1
        ");
        $selC->execute([':a'=>$a, ':b'=>$b]);
        $conv_id = (int)($selC->fetchColumn() ?: 0);

        if ($conv_id === 0) {
          $cins = $pdo->prepare("INSERT INTO conversations (created_at) VALUES (CURRENT_TIMESTAMP)");
          $cins->execute();
          $conv_id = (int)$pdo->lastInsertId();

          $pins = $pdo->prepare("
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (:cid, :ua), (:cid, :ub)
          ");
          $pins->execute([':cid'=>$conv_id, ':ua'=>$a, ':ub'=>$b]);
        }
      } catch (\Throwable $e) {
        $conv_id = null; // non-fatal
      }
    }
  }

  $pdo->commit();

  echo json_encode([
    'ok'              => true,
    'match'           => $is_match,
    'match_id'        => $match_id,
    'conversation_id' => $conv_id,
    'other_user'      => $other_user,
    'matched_dog'     => $is_match ? [
      'id'        => (int)$dog['id'],
      'name'      => $dog['name'] ?? null,
      'photo_url' => $dog['photo_url'] ?? null,
      'user_id'   => (int)$dog['user_id'],
    ] : null,
  ]);
} catch (\Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'Server error: '.$e->getMessage()]);
}
