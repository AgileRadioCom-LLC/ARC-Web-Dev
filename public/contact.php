<?php
/**
 * AgileRadioCom — contact form mail handler
 * Receives a JSON POST from the contact page and forwards it to the recipient
 * address via PHP mail(). Deploy this file alongside the static site on Bluehost.
 */

/* ── Only accept POST ── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/* ── Parse JSON body ── */
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

/* ── Sanitize every field ── */
function clean(string $val): string {
    return trim(htmlspecialchars(strip_tags($val), ENT_QUOTES, 'UTF-8'));
}

$firstName = clean($input['firstName'] ?? '');
$lastName  = clean($input['lastName']  ?? '');
$email     = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$company   = clean($input['company']   ?? '');
$subject   = clean($input['subject']   ?? '');
$message   = clean($input['message']   ?? '');

/* ── Server-side validation ── */
if (!$firstName || !$lastName || !$subject || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

if (strlen($message) < 10) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is too short']);
    exit;
}

/* ── Build the email ── */
$to          = 'sisay@agileradiocom.com';
$emailSubject = 'Contact Form: ' . $subject;

$body  = "You have a new message from the AgileRadioCom website contact form.\n";
$body .= "─────────────────────────────────────────\n";
$body .= "Name:    {$firstName} {$lastName}\n";
$body .= "Email:   {$email}\n";
if ($company) {
    $body .= "Company: {$company}\n";
}
$body .= "Subject: {$subject}\n";
$body .= "─────────────────────────────────────────\n\n";
$body .= $message . "\n";

/* Reply-To is set to the sender so you can hit Reply in your email client */
$headers  = "From: noreply@agileradiocom.com\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

/* ── Send ── */
header('Content-Type: application/json');

if (mail($to, $emailSubject, $body, $headers)) {
    http_response_code(200);
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email — please try again or contact us directly']);
}
