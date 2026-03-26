<?php
// api/get_dogs.php
declare(strict_types=1);
header('Content-Type: application/json');

// ---- CORS (dev localhost vs Aptitude) ----
$origin = (isset($_SERVER['HTTP_ORIGIN']) && str_contains($_SERVER['HTTP_ORIGIN'], 'localhost'))
  ? $_SERVER['HTTP_ORIGIN']
  : 'https://aptitude.cse.buffalo.edu';
header("Access-Control-Allow-Origin: $origin");
header('Vary: Origin');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Use GET']);
  exit;
}

try {
  $pdo = get_db();

  // -------- Common params --------
  $limit    = max(1, min(50, (int)($_GET['limit'] ?? 10)));
  $after_id = isset($_GET['after_id']) ? (int)$_GET['after_id'] : 0;

  // Optional filters incoming from FE (various shapes)
  $sizesRaw     = isset($_GET['sizes'])      ? trim((string)$_GET['sizes']) : '';    // "Small" or "Small,Medium"
  $energy_min   = isset($_GET['energy_min']) ? (int)$_GET['energy_min']     : null;  // 0..100
  $energy_1to5  = isset($_GET['energy'])     ? (int)$_GET['energy']         : null;  // 1..5
  $min_age      = isset($_GET['min_age'])    ? (int)$_GET['min_age']        : null;  // years
  $max_age      = isset($_GET['max_age'])    ? (int)$_GET['max_age']        : null;  // years
  $age_label    = isset($_GET['age_label'])  ? trim((string)$_GET['age_label']) : ''; // "Puppy 0–1", "Young 1–3", etc.

  // Modes
  $user_id     = isset($_GET['user_id'])   ? (int)$_GET['user_id']   : 0; // profile mode
  $feed        = isset($_GET['feed'])      ? (int)$_GET['feed']      : 0; // feed mode
  $viewer_id   = isset($_GET['viewer_id']) ? (int)$_GET['viewer_id'] : 0; // required for feed
  $exclude_swiped = isset($_GET['exclude_swiped']) ? (int)$_GET['exclude_swiped'] : 0;

  $params = [];
  $wheres = [];
  $order  = ' ORDER BY id DESC ';
  $paginate = ' LIMIT :lim ';

  if ($after_id > 0) {
    $wheres[] = ' id < :after_id ';
    $params[':after_id'] = $after_id;
  }

  // -------- Mode selection --------
  if ($user_id > 0 && $feed === 0) {
    // profile mode: only that user's dogs
    $wheres[] = ' user_id = :uid ';
    $params[':uid'] = $user_id;

  } elseif ($feed === 1) {
    if ($viewer_id <= 0) {
      http_response_code(400);
      echo json_encode(['ok' => false, 'error' => 'Missing viewer_id for feed']);
      exit;
    }

    // show dogs not owned by the viewer
    $wheres[] = ' user_id <> :viewer ';
    $params[':viewer'] = $viewer_id;

    // exclude dogs the viewer has already swiped on
    if ($exclude_swiped === 1) {
      $wheres[] = ' NOT EXISTS (
        SELECT 1 FROM swipes s
        WHERE s.user_id = :viewer_swipe
          AND s.dog_id  = dogs.id
      ) ';
      $params[':viewer_swipe'] = $viewer_id;
    }

  } else {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Provide either user_id (profile) OR feed=1&viewer_id (feed)']);
    exit;
  }

  // -------- Filters --------

  // 1) Size(s): allow single or CSV list; compare case-insensitively
  if ($sizesRaw !== '') {
    $sizeList = array_values(array_filter(array_map('trim', explode(',', $sizesRaw))));
    if (!empty($sizeList)) {
      $placeholders = [];
      foreach ($sizeList as $i => $sv) {
        $ph = ":size_$i";
        $placeholders[] = $ph;
        $params[$ph] = strtolower($sv);
      }
      $wheres[] = ' LOWER(size) IN (' . implode(',', $placeholders) . ') ';
    }
  }

  // 2) Energy: accept either energy_min (0..100) or energy (1..5).
  // Normalize DB value to 0..100 via CASE and compare against unified threshold.
  if ($energy_min !== null || $energy_1to5 !== null) {
    $threshold = ($energy_min !== null) ? $energy_min : max(1, min(5, $energy_1to5)) * 20;
    $virtualEnergy = "CASE WHEN energy_level <= 5 THEN energy_level*20 ELSE energy_level END";
    $wheres[] = " ($virtualEnergy) >= :energy_threshold ";
    $params[':energy_threshold'] = $threshold;
  }

  // 3) Age: accept numeric min/max or a label like "Young 1–3"
  // Represent stored age (numeric or label) as a number of years for comparisons.
  $caseAge = "
    CASE
      WHEN age_years REGEXP '^[0-9]+' THEN CAST(age_years AS SIGNED)
      WHEN age_years LIKE 'Puppy%'  THEN 0
      WHEN age_years LIKE 'Young%'  THEN 2
      WHEN age_years LIKE 'Adult%'  THEN 5
      WHEN age_years LIKE 'Senior%' THEN 9
      ELSE 0
    END
  ";

  if ($min_age !== null) {
    $wheres[] = " ($caseAge) >= :min_age ";
    $params[':min_age'] = $min_age;
  }
  if ($max_age !== null) {
    $wheres[] = " ($caseAge) <= :max_age ";
    $params[':max_age'] = $max_age;
  }
  if ($age_label !== '') {
    $al = strtolower(str_replace(['–', '—'], '-', $age_label)); // normalize dashes
    if (str_contains($al, 'puppy')) {
      $wheres[] = " ($caseAge) BETWEEN 0 AND 1 ";
    } elseif (str_contains($al, 'young')) {
      $wheres[] = " ($caseAge) BETWEEN 1 AND 3 ";
    } elseif (str_contains($al, 'adult')) {
      $wheres[] = " ($caseAge) BETWEEN 3 AND 7 ";
    } elseif (str_contains($al, 'senior')) {
      $wheres[] = " ($caseAge) >= 7 ";
    }
  }

  // -------- Query --------
  $sql = "SELECT id, user_id, name, breed, age_years, size, gender,
                 energy_level, personalities, bio, photo_url, created_at, updated_at
          FROM dogs ";
  if (!empty($wheres)) {
    $sql .= ' WHERE ' . implode(' AND ', $wheres);
  }
  $sql .= $order . $paginate;

  $stmt = $pdo->prepare($sql);

  foreach ($params as $k => $v) {
    if ($k === ':lim') continue;
    $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
  }
  $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);

  $stmt->execute();
  $dogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Cursor for pagination (id DESC)
  $next_cursor = null;
  if (count($dogs) === $limit) {
    $ids = array_column($dogs, 'id');
    if (!empty($ids)) $next_cursor = min($ids);
  }

  echo json_encode(['ok' => true, 'dogs' => $dogs, 'next_cursor' => $next_cursor]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
