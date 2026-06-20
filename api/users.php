<?php
/**
 * Users API (owner only for add/delete)
 *   GET  ?action=list
 *   POST ?action=add    { name, email, password, role }
 *   POST ?action=delete { id }
 *   POST ?action=password { id, password }   (owner; change a user's password)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'list');
$user = require_login();

if ($action === 'list') {
    $stmt = db()->query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at ASC');
    ok(['users' => $stmt->fetchAll()]);
}

// add / delete / password -> owner only
require_owner();

if ($action === 'add') {
    $name  = trim((string) param('name', ''));
    $email = trim((string) param('email', ''));
    $pass  = (string) param('password', '');
    $role  = (string) param('role', 'admin');
    if ($name === '' || $email === '' || $pass === '') fail('Name, email and password are required.');
    if (!in_array($role, ['owner', 'admin', 'agent'], true)) $role = 'agent';
    if (strlen($pass) < 6) fail('Password must be at least 6 characters.');

    $check = db()->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) fail('A user with this email already exists.');

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    db()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
        ->execute([$name, $email, $hash, $role]);
    log_activity("User added: $email ($role)", $user['email']);
    ok(['id' => (int) db()->lastInsertId()]);
}

if ($action === 'delete') {
    $id = (int) param('id', 0);
    if ($id === (int) $user['id']) fail('You cannot delete your own account.');
    db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    log_activity("User #$id deleted", $user['email']);
    ok();
}

if ($action === 'password') {
    $id = (int) param('id', 0);
    $pass = (string) param('password', '');
    if (strlen($pass) < 6) fail('Password must be at least 6 characters.');
    $hash = password_hash($pass, PASSWORD_BCRYPT);
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $id]);
    log_activity("Password changed for user #$id", $user['email']);
    ok();
}

fail('Unknown action.', 404);
