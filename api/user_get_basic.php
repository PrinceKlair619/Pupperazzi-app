<?php
declare(strict_types=1);

header("Content-Type: application/json");

require __DIR__ . "/db.php";
$pdo = get_db();

$user_id = (int)($_GET["user_id"] ?? 0);

if ($user_id <= 0) {
  echo json_encode(["ok"=>false,"error"=>"missing user_id"]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT id, display_name, bio, avatar_url
  FROM users
  WHERE id = ?
  LIMIT 1
");
$stmt->execute([$user_id]);

$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  echo json_encode(["ok"=>false,"error"=>"not_found"]);
  exit;
}

echo json_encode(["ok"=>true, "user"=>$row]);
