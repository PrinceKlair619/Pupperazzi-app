<?php
declare(strict_types=1);

header("Content-Type: application/json");

$origin = str_contains($_SERVER["HTTP_HOST"], "aptitude")
  ? "https://aptitude.cse.buffalo.edu"
  : "http://localhost:5173";

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") exit;

require __DIR__ . "/db.php";
$pdo = get_db();

$in = json_decode(file_get_contents("php://input"), true) ?: $_POST;

$cid = (int)($in["conversation_id"] ?? 0);
$sender = (int)($in["sender_id"] ?? 0);
$body = trim($in["body"] ?? "");

if (!$cid || !$sender || $body === "") {
    echo json_encode(["ok" => false, "error" => "Missing fields"]);
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO messages (conversation_id, sender_id, body, created_at)
    VALUES (:cid, :sid, :body, NOW())
");

$stmt->execute([
    ":cid" => $cid,
    ":sid" => $sender,
    ":body" => $body,
]);

echo json_encode([
    "ok" => true,
    "message" => [
        "id" => (int)$pdo->lastInsertId(),
    ]
]);
