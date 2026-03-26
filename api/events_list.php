<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && str_contains($origin, 'aptitude.cse.buffalo.edu')) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . "/db.php";

try {
    $pdo = get_db();
    $uid = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
    $limit = isset($_GET["limit"]) ? max(1, (int)$_GET["limit"]) : 20;

    $sql = "
        SELECT
            e.id,
            e.slug,
            e.title,
            e.starts_at,
            e.location,
            e.cover_url,
            e.description,
            e.details_json,
            e.category,
            u.id AS host_id,
            COALESCE(u.display_name, u.username, u.email) AS host_name,
            u.avatar_url AS host_avatar
        FROM events e
        JOIN users u ON u.id = e.host_user_id
        WHERE e.starts_at >= NOW()
        ORDER BY e.starts_at ASC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $events = [];

    foreach ($rows as $r) {
        $details = [];
        if (!empty($r["details_json"])) {
            $d = json_decode($r["details_json"], true);
            if (is_array($d)) $details = $d;
        }

        $events[] = [
            "id" => (int)$r["id"],
            "slug" => $r["slug"],
            "title" => $r["title"],
            "starts_at" => $r["starts_at"],
            "location" => $r["location"],
            "cover_url" => $r["cover_url"],
            "description" => $r["description"],
            "details" => $details,
            "category" => $r["category"],
            "host" => [
                "id" => (int)$r["host_id"],
                "name" => $r["host_name"],
                "avatar_url" => $r["host_avatar"],
            ],
        ];
    }

    echo json_encode(["ok" => true, "events" => $events]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "server_error"]);
}
