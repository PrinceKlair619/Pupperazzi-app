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

// ADD TRAILING SLASH — REQUIRED
$uploadDir = __DIR__ . "/uploads/";
if (!file_exists($uploadDir)) mkdir($uploadDir, 0775, true);

$originalName = $_FILES["photo"]["name"] ?? "";
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if (!$ext) $ext = "jpg";

$filename = "avatar_" . uniqid("u{$userId}_") . "." . $ext;
$path = $uploadDir . $filename;

// DEBUG: check if tmp file exists
if (!is_uploaded_file($_FILES["photo"]["tmp_name"])) {
    echo json_encode(["ok" => false, "error" => "Temp file missing"]);
    exit;
}

if (!move_uploaded_file($_FILES["photo"]["tmp_name"], $path)) {
    echo json_encode([
        "ok" => false,
        "error" => "Failed to save file",
        "debug" => [
            "uploadDir" => $uploadDir,
            "path" => $path,
            "exists_uploadDir" => file_exists($uploadDir),
            "is_writable_uploadDir" => is_writable($uploadDir)
        ]
    ]);
    exit;
}

// FULL PUBLIC URL
$publicUrl = "/CSE442/2025-Fall/cse-442ac/api/uploads/" . $filename;

require __DIR__ . "/db.php";
$pdo = get_db();
$stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
$stmt->execute([$publicUrl, $userId]);

echo json_encode([
    "ok" => true,
    "avatar_url" => $publicUrl
]);
