<?php
// Debug (remove later)
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

header('Content-Type: application/json');

// CORS
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

function bad($code, $msg) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

try {
  $pdo = get_db();
  if (!$pdo) bad(500, 'Database connection failed');
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
  bad(500, 'DB connection error: ' . $e->getMessage());
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') bad(405, 'Use POST');

$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// Required (per your FE)
$email      = trim($in['email']     ?? '');
$username   = trim($in['username']  ?? '');
$password   = $in['password']       ?? '';

// Additional profile fields (map camelCase -> snake_case)
$first_name = trim($in['firstName'] ?? '');
$last_name  = trim($in['lastName']  ?? '');
$phone      = trim($in['phone']     ?? '');
$location   = trim($in['location']  ?? '');

// ===== Validation =====
if ($email === '' || $username === '' || $password === '') {
  bad(400, 'email, username, password are required');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bad(400, 'invalid email');
if (strlen($email) > 255) bad(400, 'email must be 255 characters or less');
if (strlen($username) < 3 || strlen($username) > 50) bad(400, 'username must be 3–50 chars');
if (strlen($password) < 8) bad(400, 'password must be at least 8 chars');
if (!preg_match('/\d/', $password)) bad(400, 'password must contain at least one number');
if (!preg_match('/[^A-Za-z0-9]/', $password)) bad(400, 'password must contain at least one special character');

// If your DB has NOT NULL on these, enforce non-empty here
if ($first_name === '' || $last_name === '') {
  bad(400, 'first name and last name are required');
}

// Optional: normalize phone a bit (kept permissive)
if ($phone !== '' && !preg_match('/^\+?[\d\s().-]{7,20}$/', $phone)) {
  bad(400, 'invalid phone number format');
}

try {
  // Uniqueness check
  $stmt = $pdo->prepare("SELECT 1 FROM users WHERE email = :e OR username = :u LIMIT 1");
  $stmt->execute([':e' => $email, ':u' => $username]);
  if ($stmt->fetch()) bad(409, 'email or username already in use');

  $hash = password_hash($password, PASSWORD_DEFAULT);

  // Insert all needed columns.
  // Make sure these column names match your table schema exactly.
  $lat = $in['lat'] ?? null;
  $lon = $in['lon'] ?? null;

  $sql = "
    INSERT INTO users
      (email, username, password_hash, first_name, last_name, phone, location, lat, lon)
    VALUES
      (:email, :username, :hash, :first_name, :last_name, :phone, :location, :lat, :lon)
  ";

  $ins = $pdo->prepare($sql);
  $ins->execute([
    ':email'      => $email,
    ':username'   => $username,
    ':hash'       => $hash,
    ':first_name' => $first_name,
    ':last_name'  => $last_name,
    ':phone'      => $phone,
    ':location'   => $location,
    ':lat'        => $lat,
    ':lon'        => $lon,
  ]);

/*  $sql = "
    INSERT INTO users
      (email, username, password_hash, first_name, last_name, phone, location)
    VALUES
      (:email, :username, :hash, :first_name, :last_name, :phone, :location)
  ";
  $ins = $pdo->prepare($sql);
  $ins->execute([
    ':email'      => $email,
    ':username'   => $username,
    ':hash'       => $hash,
    ':first_name' => $first_name,
    ':last_name'  => $last_name,
    ':phone'      => $phone,
    ':location'   => $location,
  ]);
*/
  http_response_code(201);
  echo json_encode([
    'ok' => true,
    'user' => [
      'id'         => (int)$pdo->lastInsertId(),
      'email'      => $email,
      'username'   => $username,
      'first_name' => $first_name,
      'last_name'  => $last_name,
      'phone'      => $phone,
      'location'   => $location,
      'created_at' => date('c'),
    ],
  ]);
} catch (Throwable $e) {
  bad(500, 'Server error: ' . $e->getMessage());
}
