<?php
declare(strict_types=1);

header("Content-Type: application/json");
$origin = str_contains($_SERVER["HTTP_HOST"], "aptitude")
  ? "https://aptitude.cse.buffalo.edu"
  : "http://localhost:5173";

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") exit;

require __DIR__ . "/db.php";

try {
    $pdo = get_db();

    $slug = trim($_GET["slug"] ?? "");
    if ($slug === "") {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "Missing slug"]);
        exit;
    }

    $sql = "
        SELECT
            e.*,
            u.id AS host_id,
            COALESCE(u.display_name, u.username, u.email) AS host_name,
            u.avatar_url AS host_avatar
        FROM events e
        JOIN users u ON e.host_user_id = u.id
        WHERE e.slug = :slug
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([":slug" => $slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(["ok" => false, "error" => "not_found"]);
        exit;
    }

    $details = [];
    if (!empty($row["details_json"])) {
        $d = json_decode($row["details_json"], true);
        if (is_array($d)) $details = $d;
    }

    echo json_encode([
        "ok" => true,
        "event" => [
            "id" => (int)$row["id"],
            "slug" => $row["slug"],
            "title" => $row["title"],
            "starts_at" => $row["starts_at"],
            "location" => $row["location"],
            "cover_url" => $row["cover_url"],
            "description" => $row["description"],
            "details" => $details,
            "host" => [
                "id" => (int)$row["host_id"],
                "name" => $row["host_name"],
                "avatar_url" => $row["host_avatar"],
            ],
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "server_error"]);
}
