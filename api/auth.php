<?php
/**
 * Auth API
 *   POST ?action=login    { email, password }
 *   POST ?action=logout
 *   GET  ?action=session  -> current logged-in user (or null)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'session');

if ($action === 'login') {
    $email = trim((string) param('email', ''));
    $password = (string) param('password', '');
    if ($email === '' || $password === '') fail('Email and password are required.');

    $stmt = db()->prepare('SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'active' || !password_verify($password, $user['password_hash'])) {
        fail('Invalid email or password.', 401);
    }

    start_session();
    $_SESSION['user'] = [
        'id'    => (int) $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ];
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

// default: session check
ok(['user' => current_user()]);
