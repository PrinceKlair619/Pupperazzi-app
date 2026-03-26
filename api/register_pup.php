<?php
// Debug mode
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

header('Content-Type: application/json');

// CORS headers
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
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    bad(405, 'Use POST');
}

// Read JSON input
$input = file_get_contents('php://input');
$in = json_decode($input, true);

if (!is_array($in)) {
    bad(400, 'Invalid JSON input');
}

// Extract and validate required fields
$name = trim($in['name'] ?? '');
$breed = trim($in['breed'] ?? '');
$size = trim($in['size'] ?? '');
$gender = trim($in['gender'] ?? '');
$age = trim($in['age'] ?? ''); // Keep as string to match frontend options
$energy = isset($in['energy']) ? (int)$in['energy'] : 0;

// Personalities - handle array properly
$personalities = $in['personalities'] ?? [];
if (!is_array($personalities)) {
    $personalities = [];
}
$personalities = array_values(array_unique(array_filter(array_map('trim', $personalities))));
$personalitiesJson = json_encode($personalities, JSON_UNESCAPED_SLASHES);

// Validation
if (empty($name)) {
    bad(400, 'Dog name is required.');
}
if (empty($breed)) {
    bad(400, 'Breed is required.');
}
if (empty($size)) {
    bad(400, 'Size is required.');
}
if (empty($gender)) {
    bad(400, 'Gender is required.');
}
if (empty($age)) {
    bad(400, 'Age is required.');
}

// Energy validation (1-100 to match frontend)
if ($energy < 1 || $energy > 100) {
    bad(400, 'Energy level must be between 1 and 100.');
}

// Gender validation
$allowedGenders = ['Male', 'Female'];
if (!in_array($gender, $allowedGenders)) {
    bad(400, 'Invalid gender value. Must be Male or Female.');
}

// Size validation
$allowedSizes = ['Tiny', 'Small', 'Medium', 'Large', 'Giant'];
if (!in_array($size, $allowedSizes)) {
    bad(400, 'Invalid size value.');
}

// Age validation
$allowedAges = ['Puppy (0–1)', 'Young (1–3)', 'Adult (3–7)', 'Senior (7+)'];
if (!in_array($age, $allowedAges)) {
    bad(400, 'Invalid age value.');
}

try {
    $pdo = get_db();
    if (!$pdo) {
        bad(500, 'Database connection failed.');
    }

    // For now, use a placeholder owner_id until authentication is implemented
    $owner_id = 1; // Replace with actual user ID from session/auth

    $sql = "INSERT INTO dogs (owner_id, name, breed, age, size, gender, energy_level, personalities)
            VALUES (:owner_id, :name, :breed, :age, :size, :gender, :energy, :personalities)";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':owner_id', $owner_id, PDO::PARAM_INT);
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':breed', $breed, PDO::PARAM_STR);
    $stmt->bindValue(':age', $age, PDO::PARAM_STR);
    $stmt->bindValue(':size', $size, PDO::PARAM_STR);
    $stmt->bindValue(':gender', $gender, PDO::PARAM_STR);
    $stmt->bindValue(':energy', $energy, PDO::PARAM_INT);
    $stmt->bindValue(':personalities', $personalitiesJson, PDO::PARAM_STR);

    if (!$stmt->execute()) {
        bad(500, 'Failed to execute database query.');
    }

    $id = (int)$pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'ok' => true,
        'dog' => [
            'id' => $id,
            'owner_id' => $owner_id,
            'name' => $name,
            'breed' => $breed,
            'age' => $age,
            'size' => $size,
            'gender' => $gender,
            'energy_level' => $energy,
            'personalities' => $personalities,
        ],
    ], JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    error_log("Database error: " . $e->getMessage());
    bad(500, 'Server error: ' . $e->getMessage());
}
?>