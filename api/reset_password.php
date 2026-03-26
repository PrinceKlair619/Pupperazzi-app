<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit;
}

require __DIR__ . '/db.php';
$pdo = get_db();

function bad($code, $msg) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') bad(405, 'Use POST');

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($email === '' || $password === '') bad(400, 'Email and password are required');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bad(400, 'Invalid email');
if (strlen($password) < 8) bad(400, 'Password must be at least 8 characters');

try {
  // Check if email exists
  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
  $stmt->execute([':email' => $email]);
  $user = $stmt->fetch();

  if (!$user) bad(404, 'No account found with that email');

  // Update password
  $hash = password_hash($password, PASSWORD_DEFAULT);
  $update = $pdo->prepare("UPDATE users SET password_hash = :h WHERE email = :email");
  $update->execute([':h' => $hash, ':email' => $email]);

  echo json_encode(['ok' => true, 'message' => 'Password reset successful']);
} catch (Throwable $e) {
  bad(500, 'Server error: ' . $e->getMessage());
}
