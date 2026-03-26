<?php
declare(strict_types=1);

header("Content-Type: application/json");

$origin = str_contains($_SERVER["HTTP_HOST"], "aptitude")
  ? "https://aptitude.cse.buffalo.edu"
  : "http://localhost:5173";

header("Access-Control-Allow-Origin: $origin");

require __DIR__ . "/db.php";
$pdo = get_db();

$cid = (int)($_GET["conversation_id"] ?? 0);
$limit = (int)($_GET["limit"] ?? 50);
$after = (int)($_GET["after_id"] ?? 0);

if (!$cid) {
    echo json_encode(["ok" => false, "error" => "Missing conversation_id"]);
    exit;
}

$sql = "
    SELECT m.id, m.sender_id, m.body, m.created_at,
           u.avatar_url AS sender_avatar_url
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = :cid
";

if ($after > 0) {
    $sql .= " AND m.id > :after ";
}

$sql .= "
    ORDER BY m.id ASC
    LIMIT :lim
";

$stmt = $pdo->prepare($sql);
$stmt->bindValue(":cid", $cid, PDO::PARAM_INT);
$stmt->bindValue(":lim", $limit, PDO::PARAM_INT);
if ($after > 0) $stmt->bindValue(":after", $after, PDO::PARAM_INT);

$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["ok" => true, "messages" => $rows]);
