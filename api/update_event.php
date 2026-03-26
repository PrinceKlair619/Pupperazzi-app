<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

try {
    // Aptitude is weird: just use GET / query params
    $data = $_GET;

    $id          = (int)($data['id'] ?? 0);
    $title       = trim((string)($data['title'] ?? ''));
    $startsAt    = trim((string)($data['starts_at'] ?? ''));
    $location    = trim((string)($data['location'] ?? ''));
    $coverUrl    = trim((string)($data['cover_url'] ?? ''));
    $description = trim((string)($data['description'] ?? ''));
    $category    = trim((string)($data['category'] ?? 'activity'));
    $hostUserId  = (int)($data['host_user_id'] ?? 0);

    $details = $data['details'] ?? '[]';
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

    if ($id <= 0 || $hostUserId <= 0 || $title === '' || $startsAt === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'missing_required_fields']);
        exit;
    }

    $details_json = json_encode(array_values($details));

    $pdo = get_db();

    // Confirm event exists and belongs to this host
    $stmt = $pdo->prepare('SELECT host_user_id FROM events WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'not_found']);
        exit;
    }

    if ((int)$row['host_user_id'] !== $hostUserId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }

    $sql = "
        UPDATE events
        SET title = :title,
            starts_at = :starts_at,
            location = :location,
            cover_url = :cover_url,
            description = :description,
            details_json = :details_json,
            category = :category
        WHERE id = :id
    ";

    $update = $pdo->prepare($sql);
    $update->execute([
        ':title'        => $title,
        ':starts_at'    => $startsAt,
        ':location'     => $location,
        ':cover_url'    => $coverUrl !== '' ? $coverUrl : null,
        ':description'  => $description,
        ':details_json' => $details_json,
        ':category'     => $category !== '' ? $category : 'activity',
        ':id'           => $id,
    ]);

    echo json_encode([
        'ok'    => true,
        'event' => [
            'id'           => $id,
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
        'ok'      => false,
        'error'   => 'server_error',
        'message' => $e->getMessage(),
    ]);
}
