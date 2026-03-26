<?php
// api/dog_create.php
ini_set('display_errors', 0);
header('Content-Type: application/json');

// CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  exit;
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Use POST']);
  exit;
}

// DB connect
try {
  $pdo = get_db();
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB connection error']);
  exit;
}

// Parse JSON body
$in = json_decode(file_get_contents('php://input'), true) ?: [];

// Inputs
$userId        = isset($in['userId']) ? (int)$in['userId'] : 0;
$name          = trim($in['name'] ?? '');
$breed         = trim($in['breed'] ?? '');
$ageYears      = trim((string)($in['age_years'] ?? $in['age'] ?? '')); // store as label/string
$size          = trim($in['size'] ?? '');
$gender        = trim($in['gender'] ?? '');
$energyRaw     = $in['energy'] ?? $in['energy_level'] ?? null;          // expect 1..5
$personalities = $in['personalities'] ?? [];
$bio           = trim($in['bio'] ?? '');
$photoUrl      = trim($in['photoUrl'] ?? '');

// Required checks
if ($userId <= 0) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Missing/invalid userId']); exit;
}
if ($name === '' || $breed === '' || $ageYears === '' || $size === '' || $gender === '' || $energyRaw === null) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Required fields missing']); exit;
}

// Enforce allowed values
$allowedSizes = ['Small','Medium','Large'];
$allowedGender = ['Male','Female'];
if (!in_array($size, $allowedSizes, true))   { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid size']); exit; }
if (!in_array($gender, $allowedGender, true)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid gender']); exit; }

// ENERGY: store exactly 1..5
$energy = (int)$energyRaw;
if ($energy < 1 || $energy > 5) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Energy must be 1..5']); exit;
}

// Personalities → JSON string
if (!is_array($personalities)) $personalities = [];
$personalities_json = json_encode(array_values($personalities), JSON_UNESCAPED_UNICODE);
if ($personalities_json === false) $personalities_json = '[]';

// Length guards
if (strlen($name) > 100)        $name = substr($name, 0, 100);
if (strlen($breed) > 100)       $breed = substr($breed, 0, 100);
if (strlen($ageYears) > 50)     $ageYears = substr($ageYears, 0, 50);
if (strlen($size) > 20)         $size = substr($size, 0, 20);
if (strlen($gender) > 10)       $gender = substr($gender, 0, 10);
if ($photoUrl !== '' && strlen($photoUrl) > 255) $photoUrl = substr($photoUrl, 0, 255);

// Ensure user exists
try {
  $chk = $pdo->prepare("SELECT id FROM users WHERE id=:id LIMIT 1");
  $chk->execute([':id'=>$userId]);
  if (!$chk->fetchColumn()) {
    http_response_code(400); echo json_encode(['ok'=>false,'error'=>'User does not exist']); exit;
  }
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'User check failed']); exit;
}

// Insert
try {
  $stmt = $pdo->prepare("
    INSERT INTO dogs
      (user_id, name, breed, age_years, size, gender, energy_level, personalities, bio, photo_url, created_at, updated_at)
    VALUES
      (:user_id, :name, :breed, :age_years, :size, :gender, :energy_level, :personalities, :bio, :photo_url, NOW(), NOW())
  ");
  $ok = $stmt->execute([
    ':user_id'       => $userId,
    ':name'          => $name,
    ':breed'         => $breed,
    ':age_years'     => $ageYears,            // store the label/string
    ':size'          => $size,
    ':gender'        => $gender,
    ':energy_level'  => $energy,              // store 1..5
    ':personalities' => $personalities_json,  // TEXT/JSON column
    ':bio'           => $bio !== '' ? $bio : null,
    ':photo_url'     => $photoUrl !== '' ? $photoUrl : null,
  ]);

  if (!$ok) {
    $err = $stmt->errorInfo();
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Insert failed','detail'=>$err[2] ?? 'unknown']); exit;
  }

  echo json_encode([
    'ok'    => true,
    'dogId' => (int)$pdo->lastInsertId(),
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'Server error','detail'=>$e->getMessage()]);
}
