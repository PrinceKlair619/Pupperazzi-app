<?php
declare(strict_types=1);

// Normalize and inspect the HTTP method
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$method = strtoupper(trim($method));

header('Content-Type: application/json; charset=utf-8');

// CORS for Aptitude + local dev
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && str_contains($origin, 'aptitude.cse.buffalo.edu')) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight only
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 🔴 IMPORTANT: do NOT block GET/POST here.
// Aptitude is passing the request to PHP as GET even though the browser shows POST,
// so if we enforce POST only, it will always fail.
// From here on, we just treat it like a normal create request.

require __DIR__ . '/db.php';

// ---------- Parse JSON body ----------
// ---------- Parse JSON body, with fallbacks ----------
// ---------- Parse JSON body, with fallbacks ----------
$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);

// If JSON decode failed or we got an empty array, try normal POST fields
if (!is_array($data) || !$data) {
    $data = $_POST;
}

// If still nothing, try GET query params (for Aptitude weirdness)
if (!is_array($data) || !$data) {
    $data = $_GET;
}

// If still nothing, we can't continue – debug what PHP actually sees
if (!is_array($data) || !$data) {
    http_response_code(400);
    echo json_encode([
        'ok'    => false,
        'error' => 'invalid_json',
        'raw'   => $raw,
        'ctype' => $_SERVER['CONTENT_TYPE'] ?? null,
        'post'  => $_POST,
        'get'   => $_GET,
        'method'=> $_SERVER['REQUEST_METHOD'] ?? null,
    ]);
    exit;
}



// ---------- Extract & validate fields ----------
$title       = trim((string)($data['title']       ?? ''));
$startsAt    = trim((string)($data['starts_at']   ?? ''));
$location    = trim((string)($data['location']    ?? ''));
$coverUrl    = trim((string)($data['cover_url']   ?? ''));
$description = trim((string)($data['description'] ?? ''));
$details     = $data['details'] ?? [];
$hostUserId  = (int)($data['host_user_id'] ?? 0);
$category    = trim((string)($data['category']    ?? 'activity'));

if (is_string($details)) {
    $decoded = json_decode($details, true);
    if (is_array($decoded)) {
        $details = $decoded;
    } else {
        $details = [];
    }
} elseif (!is_array($details)) {
    $details = [];
}

if ($title === '' || $startsAt === '' || $hostUserId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_required_fields']);
    exit;
}

$details_json = json_encode(array_values($details));

// ---------- Insert into DB ----------
try {
    $pdo = get_db();

    // Build a unique slug from the title
    $baseSlug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $title));
    $baseSlug = trim($baseSlug, '-');
    if ($baseSlug === '') {
        $baseSlug = 'event';
    }

    $slug = $baseSlug;
    $i = 2;
    $checkStmt = $pdo->prepare('SELECT 1 FROM events WHERE slug = ? LIMIT 1');
    while (true) {
        $checkStmt->execute([$slug]);
        if (!$checkStmt->fetchColumn()) {
            break;
        }
        $slug = $baseSlug . '-' . $i;
        $i++;
    }

    // NOTE: assumes events table has these columns:
    // slug, title, starts_at, location, cover_url, description, details_json, host_user_id, category
    $sql = "
        INSERT INTO events
            (slug, title, starts_at, location, cover_url, description, details_json, host_user_id, category)
        VALUES
            (:slug, :title, :starts_at, :location, :cover_url, :description, :details_json, :host_user_id, :category)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':slug'         => $slug,
        ':title'        => $title,
        ':starts_at'    => $startsAt,
        ':location'     => $location,
        ':cover_url'    => $coverUrl !== '' ? $coverUrl : null,
        ':description'  => $description,
        ':details_json' => $details_json,
        ':host_user_id' => $hostUserId,
        ':category'     => $category !== '' ? $category : 'activity',
    ]);

    $id = (int)$pdo->lastInsertId();

    echo json_encode([
        'ok'    => true,
        'event' => [
            'id'           => $id,
            'slug'         => $slug,
            'title'        => $title,
            'starts_at'    => $startsAt,
            'location'     => $location,
            'cover_url'    => $coverUrl !== '' ? $coverUrl : null,
            'description'  => $description,
            'details'      => json_decode($details_json, true),
            'host_user_id' => $hostUserId,
            'category'     => $category !== '' ? $category : 'activity',
        ],
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'server_error',
        // keep this during dev so you can see the real problem in the Network tab
        'message' => $e->getMessage(),
    ]);
}
