<?php
/**
 * AgileRadioCom — newsletter subscribe handler
 * Receives a JSON POST, validates it, and appends the new subscriber
 * to data/subs.json stored alongside this file on the server.
 * The data/ directory is blocked from direct browser access via .htaccess.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

header('Content-Type: application/json');

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

function clean(string $val): string {
    return trim(htmlspecialchars(strip_tags($val), ENT_QUOTES, 'UTF-8'));
}

$firstName = clean($input['firstName'] ?? '');
$lastName  = clean($input['lastName']  ?? '');
$email     = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);

if (!$firstName || !$lastName) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter your first and last name.']);
    exit;
}

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address.']);
    exit;
}

/* ── Load existing subscriber list ── */
$dataFile = __DIR__ . '/data/subs.json';

if (file_exists($dataFile)) {
    $stored = json_decode(file_get_contents($dataFile), true);
    if (!is_array($stored) || !isset($stored['subscribers'])) {
        $stored = ['subscribers' => []];
    }
} else {
    $stored = ['subscribers' => []];
}

/* ── Reject duplicate emails (case-insensitive) ── */
$emailLower = strtolower($email);
foreach ($stored['subscribers'] as $sub) {
    if (strtolower($sub['email']) === $emailLower) {
        http_response_code(200);
        echo json_encode(['success' => true, 'note' => 'already_subscribed']);
        exit;
    }
}

/* ── Append new subscriber ── */
$stored['subscribers'][] = [
    'firstName'   => $firstName,
    'lastName'    => $lastName,
    'email'       => $email,
    'subscribedAt' => date('c'), /* ISO 8601 timestamp */
];

/* ── Write back with exclusive lock to prevent race conditions ── */
$fh = fopen($dataFile, 'c');
if (!$fh || !flock($fh, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save subscription — please try again.']);
    exit;
}

ftruncate($fh, 0);
rewind($fh);
fwrite($fh, json_encode($stored, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

http_response_code(200);
echo json_encode(['success' => true]);
