<?php
declare(strict_types=1);

// ----- CORS -----
$allowed_origins = [
    'http://localhost:5173',
    'https://aptitude.cse.buffalo.edu'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu");
}

header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
// ------------------------------------------

header("Content-Type: application/json");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . "/db.php";
$pdo = get_db();

if ($_SERVER['REQUEST_METHOD'] !== "POST") {
    echo json_encode(["ok" => false, "error" => "Use POST"]);
    exit;
}

$dog_id = $_POST["dog_id"] ?? 0;
$dog_id = intval($dog_id);

if ($dog_id <= 0) {
    echo json_encode(["ok" => false, "error" => "Invalid dog_id"]);
    exit;
}

if (!isset($_FILES["banner"])) {
    echo json_encode(["ok" => false, "error" => "No file uploaded"]);
    exit;
}

$file = $_FILES["banner"];
$ext = pathinfo($file["name"], PATHINFO_EXTENSION);
$filename = "dog_banner_" . $dog_id . "_" . time() . "." . $ext;

$target = __DIR__ . "/uploads/" . $filename;

if (!move_uploaded_file($file["tmp_name"], $target)) {
    echo json_encode(["ok" => false, "error" => "Upload failed"]);
    exit;
}

$relative_path = "/CSE442/2025-Fall/cse-442ac/api/uploads/" . $filename;

// Save in DB
$stmt = $pdo->prepare("UPDATE dogs SET banner_url = :url WHERE id = :id");
$stmt->execute([
    ":url" => $relative_path,
    ":id" => $dog_id
]);

echo json_encode([
    "ok" => true,
    "banner_url" => "https://aptitude.cse.buffalo.edu" . $relative_path
]);
