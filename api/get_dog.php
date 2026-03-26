<?php
// api/get_dog.php
declare(strict_types=1);

// IMPORTANT: no spaces or newlines before this line
header('Content-Type: application/json');

// Determine allowed origin
// Always allow localhost dev + aptitude frontend
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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Credentials: false");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/db.php';
$pdo = get_db();

// Check method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Use GET']);
    exit;
}

// Validate dog id
$dog_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($dog_id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing or invalid dog id']);
    exit;
}

try {
    // Fetch dog
    $stmt = $pdo->prepare("
        SELECT id, user_id, name, breed, age_years, size, gender,
               energy_level, personalities, bio, photo_url,
               created_at, updated_at
        FROM dogs
        WHERE id = :id
        LIMIT 1
    ");
    $stmt->bindValue(':id', $dog_id, PDO::PARAM_INT);
    $stmt->execute();

    $dog = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$dog) {
        echo json_encode(['ok' => false, 'error' => 'Dog not found']);
        exit;
    }

    // Parse personalities JSON
    if (!empty($dog['personalities'])) {
        $p = json_decode($dog['personalities'], true);
        $dog['personalities'] = is_array($p) ? $p : [];
    } else {
        $dog['personalities'] = [];
    }

    echo json_encode(['ok' => true, 'dog' => $dog]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
