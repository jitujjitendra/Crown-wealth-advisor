<?php
/**
 * Auth API
 *   POST ?action=login    { email, password }
 *   POST ?action=logout
 *   GET  ?action=session  -> current logged-in user (or null)
 *
 * Security: brute-force protection (5 failed attempts = 15 min lockout)
 * Security: session timeout after 30 min inactivity
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/rate-limiter.php';
allow_cors();

$action = param('action', 'session');

// ===== SESSION TIMEOUT (30 min) =====
define('SESSION_TIMEOUT', 1800); // 30 minutes

if ($action === 'login') {
    $email = trim((string) param('email', ''));
    $password = (string) param('password', '');
    if ($email === '' || $password === '') fail('Email and password are required.');

    // Brute-force check: 5 attempts per 15 minutes per IP
    $rl = rate_limit_check('login', 5, 900);
    if ($rl['blocked']) {
        fail('Too many failed login attempts. Please try again after ' . ceil($rl['retry_after'] / 60) . ' minutes.', 429);
    }

    $stmt = db()->prepare('SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'active' || !password_verify($password, $user['password_hash'])) {
        fail('Invalid email or password.', 401);
    }

    // Login success — reset rate limiter
    rate_limit_reset('login');

    start_session();
    $_SESSION['user'] = [
        'id'    => (int) $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ];
    $_SESSION['last_activity'] = time();
    log_activity('Logged in', $user['email']);
    ok(['user' => $_SESSION['user']]);
}

if ($action === 'logout') {
    $u = current_user();
    if ($u) log_activity('Logged out', $u['email']);
    start_session();
    $_SESSION = [];
    session_destroy();
    ok();
}

// ===== SESSION CHECK (with timeout) =====
start_session();
if (isset($_SESSION['user']) && isset($_SESSION['last_activity'])) {
    if ((time() - $_SESSION['last_activity']) > SESSION_TIMEOUT) {
        // Session expired
        $_SESSION = [];
        session_destroy();
        ok(['user' => null]);
    }
    // Refresh last activity
    $_SESSION['last_activity'] = time();
}
ok(['user' => current_user()]);
