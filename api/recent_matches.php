<?php
// api/recent_matches.php
declare(strict_types=1);
header('Content-Type: application/json');

// CORS
$origin = (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'aptitude.cse.buffalo.edu'))
  ? 'https://aptitude.cse.buffalo.edu' : 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/db.php';
$pdo = get_db();

$userId = (int)($_GET['user_id'] ?? 0);
$limit  = max(1, min(20, (int)($_GET['limit'] ?? 10)));
if ($userId <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'missing user_id']); exit; }

$sql = "
  SELECT m.id,
         m.user_a, m.user_b, m.dog_a, m.dog_b,
         COALESCE(m.updated_at, m.created_at) AS ts
  FROM matches m
  WHERE m.user_a = :me OR m.user_b = :me
  ORDER BY ts DESC
  LIMIT :lim
";
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':me', $userId, PDO::PARAM_INT);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$out = [];
foreach ($rows as $r) {
  $iAmA = ((int)$r['user_a'] === $userId);
  $otherUserId = $iAmA ? (int)$r['user_b'] : (int)$r['user_a'];
  $otherDogId  = $iAmA ? (int)$r['dog_b']  : (int)$r['dog_a'];

  // dog info (other side’s dog)
  $dogName = 'Dog';
  $dogPhoto = null;
  if ($otherDogId > 0) {
    $qd = $pdo->prepare("SELECT name, photo_url FROM dogs WHERE id = :d LIMIT 1");
    $qd->execute([':d'=>$otherDogId]);
    if ($row = $qd->fetch(PDO::FETCH_ASSOC)) {
      $dogName  = $row['name'] ?: 'Dog';
      $dogPhoto = $row['photo_url'] ?: null;
    }
  }

  $out[] = [
    'id'          => (int)$r['id'],
    'when'        => $r['ts'],
    'dog_name'    => $dogName,
    'dog_photo'   => $dogPhoto,
    'other_user'  => $otherUserId,
  ];
}

echo json_encode(['ok'=>true, 'matches'=>$out]);
