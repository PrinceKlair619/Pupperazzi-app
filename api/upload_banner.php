<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") exit;

if (!isset($_POST["user_id"]) || !isset($_FILES["photo"])) {
    echo json_encode(["ok" => false, "error" => "Missing user_id or file"]);
    exit;
}

$userId = intval($_POST["user_id"]);
if ($userId <= 0) {
    echo json_encode(["ok" => false, "error" => "Invalid user_id"]);
    exit;
}

$uploadDir = __DIR__ . "/uploads";
if (!file_exists($uploadDir)) mkdir($uploadDir, 0775, true);

$originalName = $_FILES["photo"]["name"] ?? "";
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if (!$ext) $ext = "jpg";

$filename = "banner_" . uniqid("u{$userId}_") . "." . $ext;
$path = $uploadDir . "/" . $filename;

if (!move_uploaded_file($_FILES["photo"]["tmp_name"], $path)) {
    echo json_encode(["ok" => false, "error" => "Failed to save file"]);
    exit;
}

require __DIR__ . "/db.php";
$pdo = get_db();
$stmt = $pdo->prepare("UPDATE users SET background_path = ? WHERE id = ?");
$stmt->execute([$filename, $userId]);

echo json_encode([
    "ok" => true,
    "background_path" => "/CSE442/2025-Fall/cse-442ac/api/uploads/" . $filename
]);
