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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  bad(405, 'Use POST');
}

$email = trim($_POST['email'] ?? '');
if ($email === '') bad(400, 'Email is required');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bad(400, 'Invalid email address');

try {
  // Check if email exists in the database
  $stmt = $pdo->prepare("SELECT username FROM users WHERE email = :email LIMIT 1");
  $stmt->execute([':email' => $email]);
  $user = $stmt->fetch();

  if (!$user) bad(404, 'No account found with that email');

  // Compose email message
  $subject = "Pupperazzi Password Reset";
  $resetLink = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/app/dist/#/reset-password-confirmation";

  $message = "
  <html>
  <body style='font-family: Arial, sans-serif;'>
    <h2>Hi {$user['username']},</h2>
    <p>We received a request to reset your password for your Pupperazzi account.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href='$resetLink' style='background:#007bff;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;'>Reset Password</a></p>
    <p>If you didn’t request this, please ignore this email.</p>
    <br>
    <p>🐾 The Pupperazzi Team 🐾</p>
  </body>
  </html>
  ";

  $headers = "MIME-Version: 1.0" . "\r\n";
  $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
  $headers .= "From: noreply@pupperazzi.com" . "\r\n";

  // Send the email
  if (!mail($email, $subject, $message, $headers)) {
    bad(500, 'Failed to send email');
  }

  echo json_encode(['ok' => true, 'message' => 'Reset email sent']);
} catch (Throwable $e) {
  bad(500, 'Server error: ' . $e->getMessage());
}
