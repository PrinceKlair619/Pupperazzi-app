<?php
declare(strict_types=1);

header('Content-Type: application/json');

$origin = ($_SERVER['HTTP_HOST'] ?? '');
if (str_contains($origin, 'aptitude.cse.buffalo.edu')) {
    header("Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu");
} else {
    header("Access-Control-Allow-Origin: *");
}

require __DIR__ . '/db.php';
$pdo = get_db();

$user_id = (int)($_GET['user_id'] ?? 0);
if ($user_id <= 0) {
    echo json_encode(['ok'=>false,'error'=>'missing user_id']);
    exit;
}

$sql = "
SELECT 
    c.id AS conversation_id,
    u.id AS other_id,
    COALESCE(u.display_name, u.username, u.email) AS other_name,
    u.avatar_url AS other_avatar,
    m.body AS last_body,
    m.created_at AS last_time
FROM conversations c
JOIN conversation_participants mep
    ON mep.conversation_id = c.id AND mep.user_id = :uid
JOIN conversation_participants op
    ON op.conversation_id = c.id AND op.user_id != :uid
JOIN users u
    ON u.id = op.user_id
LEFT JOIN messages m
    ON m.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY id DESC LIMIT 1
    )
ORDER BY m.created_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':uid'=>$user_id]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$convos = [];
foreach ($rows as $r) {
    $convos[] = [
        'conversation_id' => (int)$r['conversation_id'],
        'other_id'        => (int)$r['other_id'],
        'other_name'      => $r['other_name'],
        'other_avatar'    => $r['other_avatar'],
        'last_message'    => [
            'body'       => $r['last_body'],
            'created_at' => $r['last_time'],
        ],
    ];
}

echo json_encode(['ok'=>true,'conversations'=>$convos]);
