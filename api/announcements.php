<?php
/**
 * Announcements API
 *   GET  ?action=active                          (PUBLIC - active announcements for homepage bar)
 *   GET  ?action=list                             (admin)
 *   POST ?action=save   { id?, title, message, type, link, active }  (admin)
 *   POST ?action=delete { id }                    (admin)
 *   POST ?action=toggle { id }                    (admin)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'active');

if ($action === 'active') {
    $stmt = db()->query('SELECT id, title, message, type, link FROM announcements WHERE active = 1 ORDER BY created_at DESC');
    ok(['announcements' => $stmt->fetchAll()]);
}

$user = require_login();

if ($action === 'list') {
    $stmt = db()->query('SELECT * FROM announcements ORDER BY created_at DESC');
    ok(['announcements' => $stmt->fetchAll()]);
}

if ($action === 'save') {
    $id      = (int) param('id', 0);
    $message = trim((string) param('message', ''));
    if ($message === '') fail('Message is required.');
    $title  = trim((string) param('title', ''));
    $type   = trim((string) param('type', 'info'));
    $link   = trim((string) param('link', ''));
    $active = ((int) param('active', 1)) ? 1 : 0;

    if ($id > 0) {
        db()->prepare('UPDATE announcements SET title=?, message=?, type=?, link=?, active=? WHERE id=?')
            ->execute([$title, $message, $type, $link, $active, $id]);
        log_activity("Announcement #$id updated", $user['email']);
        ok(['id' => $id]);
    } else {
        db()->prepare('INSERT INTO announcements (title, message, type, link, active) VALUES (?,?,?,?,?)')
            ->execute([$title, $message, $type, $link, $active]);
        log_activity('Announcement created', $user['email']);
        ok(['id' => (int) db()->lastInsertId()]);
    }
}

if ($action === 'toggle') {
    $id = (int) param('id', 0);
    db()->prepare('UPDATE announcements SET active = 1 - active WHERE id = ?')->execute([$id]);
    ok();
}

if ($action === 'delete') {
    $id = (int) param('id', 0);
    db()->prepare('DELETE FROM announcements WHERE id = ?')->execute([$id]);
    log_activity("Announcement #$id deleted", $user['email']);
    ok();
}

fail('Unknown action.', 404);
