<?php
/**
 * Promotions API (Homepage admin-controlled cards)
 *   GET  ?action=active                          (PUBLIC - active promotions for homepage)
 *   GET  ?action=list                             (admin)
 *   POST ?action=save   { id?, title, description, button_text, button_link, type, image, active, priority }
 *   POST ?action=toggle { id }                    (admin)
 *   POST ?action=delete { id }                    (admin)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'active');

// ---- PUBLIC: active promotions for homepage ----
if ($action === 'active') {
    $stmt = db()->query('SELECT id, title, description, button_text, button_link, type, image FROM promotions WHERE active = 1 ORDER BY priority ASC, created_at DESC');
    ok(['promotions' => $stmt->fetchAll()]);
}

// ---- Admin actions ----
$user = require_login();
require_full();

if ($action === 'list') {
    $stmt = db()->query('SELECT * FROM promotions ORDER BY priority ASC, created_at DESC');
    ok(['promotions' => $stmt->fetchAll()]);
}

if ($action === 'save') {
    $id = (int) param('id', 0);
    $title = trim((string) param('title', ''));
    if ($title === '') fail('Title is required.');
    $data = [
        $title,
        trim((string) param('description', '')),
        trim((string) param('button_text', 'Learn More')),
        trim((string) param('button_link', '#')),
        trim((string) param('type', 'general')),
        trim((string) param('image', '')),
        ((int) param('active', 1)) ? 1 : 0,
        (int) param('priority', 0),
    ];

    if ($id > 0) {
        $data[] = $id;
        db()->prepare('UPDATE promotions SET title=?, description=?, button_text=?, button_link=?, type=?, image=?, active=?, priority=? WHERE id=?')
            ->execute($data);
        log_activity("Promotion #$id updated", $user['email']);
        ok(['id' => $id]);
    } else {
        db()->prepare('INSERT INTO promotions (title, description, button_text, button_link, type, image, active, priority) VALUES (?,?,?,?,?,?,?,?)')
            ->execute($data);
        $newId = (int) db()->lastInsertId();
        log_activity("Promotion created: $title", $user['email']);
        ok(['id' => $newId]);
    }
}

if ($action === 'toggle') {
    $id = (int) param('id', 0);
    db()->prepare('UPDATE promotions SET active = 1 - active WHERE id = ?')->execute([$id]);
    ok();
}

if ($action === 'delete') {
    $id = (int) param('id', 0);
    db()->prepare('DELETE FROM promotions WHERE id = ?')->execute([$id]);
    log_activity("Promotion #$id deleted", $user['email']);
    ok();
}

fail('Unknown action.', 404);
