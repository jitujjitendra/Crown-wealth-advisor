<?php
/**
 * Shared helpers: JSON responses, request parsing, session auth, role checks
 */
require_once __DIR__ . '/db.php';

// ---- JSON helpers ----
function json_out($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
function ok($data = []) { json_out(array_merge(['success' => true], $data)); }
function fail($msg, $code = 400) { json_out(['success' => false, 'error' => $msg], $code); }

// ---- Read JSON or form body ----
function input() {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $j = json_decode($raw, true);
        if (is_array($j)) return $j;
    }
    return $_POST;
}
function param($key, $default = null) {
    $in = input();
    if (isset($in[$key])) return $in[$key];
    if (isset($_GET[$key])) return $_GET[$key];
    return $default;
}

// ---- Session / auth ----
function start_session() {
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        session_start();
    }
}
function current_user() {
    start_session();
    return isset($_SESSION['user']) ? $_SESSION['user'] : null;
}
function require_login() {
    $u = current_user();
    if (!$u) fail('Not authenticated. Please log in.', 401);
    return $u;
}
function require_owner() {
    $u = require_login();
    if ($u['role'] !== 'owner') fail('Only the owner can perform this action.', 403);
    return $u;
}

// ---- Activity log ----
function log_activity($action, $by = 'system') {
    try {
        $stmt = db()->prepare('INSERT INTO activity_log (action, by_user, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$action, $by]);
    } catch (Exception $e) { /* ignore */ }
}

// ---- CORS (same-origin on Hostinger; harmless) ----
function allow_cors() {
    header('Access-Control-Allow-Origin: ' . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}
