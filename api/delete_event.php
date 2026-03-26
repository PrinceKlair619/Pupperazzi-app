<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

try {
    $id         = (int)($_GET['id'] ?? 0);
    $hostUserId = (int)($_GET['host_user_id'] ?? 0);

    if ($id <= 0 || $hostUserId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'missing_required_fields']);
        exit;
    }

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

    // Hard delete. If there are dependent tables, set ON DELETE CASCADE in schema.
    $del = $pdo->prepare('DELETE FROM events WHERE id = ?');
    $del->execute([$id]);

    echo json_encode(['ok' => true]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'error'   => 'server_error',
        'message' => $e->getMessage(),
    ]);
}
