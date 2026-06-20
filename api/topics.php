<?php
/**
 * Blog Topics API (Admin assigns -> Agent writes)
 *   GET  ?action=list                 admin: all; agent: own assigned
 *   POST ?action=create { title, brief, assigned_to }   (full)
 *   POST ?action=delete { id }                          (full)
 *   POST ?action=status { id, status }                  (assigned|in_progress|submitted|done)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'list');
$user = require_login();

if ($action === 'list') {
    if ($user['role'] === 'agent') {
        $stmt = db()->prepare('SELECT * FROM blog_topics WHERE assigned_to = ? ORDER BY created_at DESC');
        $stmt->execute([$user['email']]);
    } else {
        $stmt = db()->query('SELECT * FROM blog_topics ORDER BY created_at DESC');
    }
    ok(['topics' => $stmt->fetchAll()]);
}

if ($action === 'create') {
    require_full();
    $title = trim((string) param('title', ''));
    if ($title === '') fail('Topic title is required.');
    $brief = trim((string) param('brief', ''));
    $assigned = trim((string) param('assigned_to', ''));
    db()->prepare('INSERT INTO blog_topics (title, brief, assigned_to, status, created_by) VALUES (?,?,?,"assigned",?)')
        ->execute([$title, $brief, $assigned, $user['email']]);
    log_activity("Blog topic assigned to $assigned: $title", $user['email']);
    ok(['id' => (int) db()->lastInsertId()]);
}

if ($action === 'status') {
    $id = (int) param('id', 0);
    $status = (string) param('status', '');
    if (!in_array($status, ['assigned','in_progress','submitted','done'], true)) fail('Invalid status.');
    // Agents may only update their own topics
    if ($user['role'] === 'agent') {
        $s = db()->prepare('SELECT assigned_to FROM blog_topics WHERE id = ?');
        $s->execute([$id]);
        $row = $s->fetch();
        if (!$row || $row['assigned_to'] !== $user['email']) fail('Not your topic.', 403);
    }
    db()->prepare('UPDATE blog_topics SET status = ? WHERE id = ?')->execute([$status, $id]);
    ok();
}

if ($action === 'delete') {
    require_full();
    $id = (int) param('id', 0);
    db()->prepare('DELETE FROM blog_topics WHERE id = ?')->execute([$id]);
    log_activity("Blog topic #$id deleted", $user['email']);
    ok();
}

fail('Unknown action.', 404);
