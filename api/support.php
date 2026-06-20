<?php
/**
 * Support Tickets API (Customer Support Center)
 *   POST ?action=create  (PUBLIC) name, mobile, email, insurance_company, policy_number, issue_type, description
 *   GET  ?action=list   [&status=&search=]
 *   GET  ?action=get&id=
 *   POST ?action=status  { id, status }
 *   POST ?action=assign  { id, assigned_to }   (full) sets assigned_date
 *   POST ?action=comment { id, text }
 *   POST ?action=delete  { id }   (full)
 *   GET  ?action=stats
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'list');

$VALID = ['new','assigned','under_review','documents_required','in_progress','resolved','closed'];

function ticket_agent_can_touch($user, $ticketId) {
    if ($user['role'] !== 'agent') return true;
    $s = db()->prepare('SELECT assigned_to FROM support_tickets WHERE id = ?');
    $s->execute([$ticketId]);
    $row = $s->fetch();
    return $row && $row['assigned_to'] === $user['email'];
}

// ---- PUBLIC: create a support ticket ----
if ($action === 'create') {
    $name = trim((string) param('name', ''));
    $mobile = trim((string) param('mobile', ''));
    if ($name === '' && $mobile === '') fail('Name or mobile is required.');
    $stmt = db()->prepare(
        'INSERT INTO support_tickets (name, mobile, email, insurance_company, policy_number, issue_type, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, "new")'
    );
    $stmt->execute([
        $name !== '' ? $name : 'Unknown',
        $mobile,
        trim((string) param('email', '')),
        trim((string) param('insurance_company', '')),
        trim((string) param('policy_number', '')),
        trim((string) param('issue_type', 'General')),
        trim((string) param('description', '')),
    ]);
    $id = (int) db()->lastInsertId();
    log_activity("New support ticket #$id from $name", 'website');
    ok(['id' => $id]);
}

// ---- Everything below requires login ----
$user = require_login();

if ($action === 'list') {
    $status = param('status', '');
    $search = trim((string) param('search', ''));
    $sql = 'SELECT * FROM support_tickets WHERE 1=1';
    $args = [];
    if ($user['role'] === 'agent') { $sql .= ' AND assigned_to = ?'; $args[] = $user['email']; }
    if ($status && in_array($status, $VALID, true)) { $sql .= ' AND status = ?'; $args[] = $status; }
    if ($search !== '') {
        $sql .= ' AND (name LIKE ? OR mobile LIKE ? OR email LIKE ? OR insurance_company LIKE ? OR issue_type LIKE ?)';
        $like = '%' . $search . '%';
        array_push($args, $like, $like, $like, $like, $like);
    }
    $sql .= ' ORDER BY created_at DESC LIMIT 1000';
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    ok(['tickets' => $stmt->fetchAll()]);
}

if ($action === 'get') {
    $id = (int) param('id', 0);
    $stmt = db()->prepare('SELECT * FROM support_tickets WHERE id = ?');
    $stmt->execute([$id]);
    $t = $stmt->fetch();
    if (!$t) fail('Ticket not found.', 404);
    if ($user['role'] === 'agent' && $t['assigned_to'] !== $user['email']) {
        fail('You can only view tickets assigned to you.', 403);
    }
    $c = db()->prepare('SELECT text, by_user, created_at FROM support_ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC');
    $c->execute([$id]);
    $t['comments'] = $c->fetchAll();
    ok(['ticket' => $t]);
}

if ($action === 'status') {
    $id = (int) param('id', 0);
    $status = (string) param('status', '');
    if (!in_array($status, $VALID, true)) fail('Invalid status.');
    if (!ticket_agent_can_touch($user, $id)) fail('You can only update tickets assigned to you.', 403);
    db()->prepare('UPDATE support_tickets SET status = ? WHERE id = ?')->execute([$status, $id]);
    log_activity("Ticket #$id status -> $status", $user['email']);
    ok();
}

if ($action === 'assign') {
    if ($user['role'] === 'agent') fail('Agents cannot assign tickets.', 403);
    $id = (int) param('id', 0);
    $to = trim((string) param('assigned_to', ''));
    db()->prepare('UPDATE support_tickets SET assigned_to = ?, assigned_date = NOW() WHERE id = ?')->execute([$to, $id]);
    log_activity("Ticket #$id assigned to $to", $user['email']);
    ok();
}

if ($action === 'comment') {
    $id = (int) param('id', 0);
    $text = trim((string) param('text', ''));
    if ($text === '') fail('Comment text is required.');
    if (!ticket_agent_can_touch($user, $id)) fail('You can only comment on tickets assigned to you.', 403);
    db()->prepare('INSERT INTO support_ticket_comments (ticket_id, text, by_user) VALUES (?, ?, ?)')->execute([$id, $text, $user['email']]);
    log_activity("Comment on ticket #$id", $user['email']);
    ok();
}

if ($action === 'delete') {
    require_full();
    $id = (int) param('id', 0);
    db()->prepare('DELETE FROM support_tickets WHERE id = ?')->execute([$id]);
    log_activity("Ticket #$id deleted", $user['email']);
    ok();
}

if ($action === 'stats') {
    $isAgent = ($user['role'] === 'agent');
    if ($isAgent) {
        $stmt = db()->prepare("SELECT status, COUNT(*) c FROM support_tickets WHERE assigned_to = ? GROUP BY status");
        $stmt->execute([$user['email']]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = db()->query("SELECT status, COUNT(*) c FROM support_tickets GROUP BY status")->fetchAll();
    }
    $stats = ['total' => 0];
    foreach ($VALID as $s) { $stats[$s] = 0; }
    foreach ($rows as $r) { $stats[$r['status']] = (int) $r['c']; $stats['total'] += (int) $r['c']; }
    ok(['stats' => $stats]);
}

fail('Unknown action.', 404);
