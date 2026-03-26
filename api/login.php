<?php
// api/login.php
declare(strict_types=1);

// ✅ Allow CORS for local testing
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// ✅ Handle preflight (OPTIONS) requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/db.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Accept either JSON or form-urlencoded
$raw = file_get_contents('php://input');
$ct  = $_SERVER['CONTENT_TYPE'] ?? '';
$in  = [];
if (stripos($ct, 'application/json') !== false) {
  $in = json_decode($raw, true) ?: [];
} else {
  $in = $_POST ?: [];
}

// Pull inputs
$emailOrUser = trim($in['email'] ?? $in['username'] ?? '');
$password    = (string)($in['password'] ?? '');

if ($emailOrUser === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Email/username and password required']);
  exit;
}

try {
  $pdo = get_db();

  // Look up by email or username
  $stmt = $pdo->prepare('SELECT id, email, username, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1');
  $stmt->execute([$emailOrUser, $emailOrUser]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Invalid credentials']);
    exit;
  }

  // Start session
  session_start();
  $_SESSION['uid'] = (int)$user['id'];

  echo json_encode([
    'ok' => true,
    'user' => [
      'id' => (int)$user['id'],
      'email' => $user['email'],
      'username' => $user['username']
    ]
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server error']);
}