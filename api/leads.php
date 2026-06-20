<?php
/**
 * Leads API
 *   GET  ?action=list   [&status=&search=]      (admin only)
 *   GET  ?action=get&id=                         (admin only)
 *   POST ?action=create { name, mobile, email, city, service, message, source }  (PUBLIC - website forms)
 *   POST ?action=status { id, status }           (admin only)
 *   POST ?action=assign { id, assigned_to }       (admin only)
 *   POST ?action=comment { id, text }             (admin only)
 *   POST ?action=delete { id }                    (owner only)
 *   GET  ?action=stats                            (admin only)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'list');

// ---- PUBLIC: create lead from website forms ----
if ($action === 'create') {
    $name = trim((string) param('name', ''));
    if ($name === '') $name = trim((string) param('fullName', ''));
    $mobile = trim((string) param('mobile', param('phone', '')));
    if ($name === '' && $mobile === '') fail('Name or mobile is required.');

    $stmt = db()->prepare(
        'INSERT INTO leads (name, mobile, email, city, service, message, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, "new")'
    );
    $stmt->execute([
        $name !== '' ? $name : 'Unknown',
        $mobile,
        trim((string) param('email', '')),
        trim((string) param('city', '')),
        trim((string) param('service', param('serviceType', 'General Inquiry'))),
        trim((string) param('message', '')),
        trim((string) param('source', 'website')),
    ]);
    $id = (int) db()->lastInsertId();
    log_activity("New lead #$id from $name", 'website');
    ok(['id' => $id]);
}

// ---- Everything below requires login ----
$user = require_login();

if ($action === 'list') {
    $status = param('status', '');
    $search = trim((string) param('search', ''));
    $sql = 'SELECT * FROM leads WHERE 1=1';
    $args = [];
    // Agents only see leads assigned to them
    if ($user['role'] === 'agent') {
        $sql .= ' AND assigned_to = ?';
        $args[] = $user['email'];
    }
    if ($status && in_array($status, ['new','wip','success','rejected'], true)) {
        $sql .= ' AND status = ?'; $args[] = $status;
    }
    if ($search !== '') {
        $sql .= ' AND (name LIKE ? OR mobile LIKE ? OR email LIKE ? OR service LIKE ? OR city LIKE ?)';
        $like = '%' . $search . '%';
        array_push($args, $like, $like, $like, $like, $like);
    }
    $sql .= ' ORDER BY created_at DESC LIMIT 1000';
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    ok(['leads' => $stmt->fetchAll()]);
}

if ($action === 'get') {
    $id = (int) param('id', 0);
    $stmt = db()->prepare('SELECT * FROM leads WHERE id = ?');
    $stmt->execute([$id]);
    $lead = $stmt->fetch();
    if (!$lead) fail('Lead not found.', 404);
    // Agents can only view leads assigned to them
    if ($user['role'] === 'agent' && $lead['assigned_to'] !== $user['email']) {
        fail('You can only view leads assigned to you.', 403);
    }
    $c = db()->prepare('SELECT text, by_user, created_at FROM lead_comments WHERE lead_id = ? ORDER BY created_at ASC');
    $c->execute([$id]);
    $lead['comments'] = $c->fetchAll();
    ok(['lead' => $lead]);
}

// Helper: ensure an agent owns the lead they are modifying
function agent_can_touch($user, $leadId) {
    if ($user['role'] !== 'agent') return true;
    $s = db()->prepare('SELECT assigned_to FROM leads WHERE id = ?');
    $s->execute([$leadId]);
    $row = $s->fetch();
    return $row && $row['assigned_to'] === $user['email'];
}

if ($action === 'status') {
    $id = (int) param('id', 0);
    $status = (string) param('status', '');
    if (!in_array($status, ['new','wip','success','rejected'], true)) fail('Invalid status.');
    if (!agent_can_touch($user, $id)) fail('You can only update leads assigned to you.', 403);
    $stmt = db()->prepare('UPDATE leads SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    log_activity("Lead #$id status -> $status", $user['email']);
    ok();
}

if ($action === 'assign') {
    if ($user['role'] === 'agent') fail('Agents cannot assign leads.', 403);
    $id = (int) param('id', 0);
    $to = trim((string) param('assigned_to', ''));
    $stmt = db()->prepare('UPDATE leads SET assigned_to = ? WHERE id = ?');
    $stmt->execute([$to, $id]);
    log_activity("Lead #$id assigned to $to", $user['email']);
    ok();
}

if ($action === 'comment') {
    $id = (int) param('id', 0);
    $text = trim((string) param('text', ''));
    if ($text === '') fail('Comment text is required.');
    if (!agent_can_touch($user, $id)) fail('You can only comment on leads assigned to you.', 403);
    $stmt = db()->prepare('INSERT INTO lead_comments (lead_id, text, by_user) VALUES (?, ?, ?)');
    $stmt->execute([$id, $text, $user['email']]);
    log_activity("Comment on lead #$id", $user['email']);
    ok();
}

if ($action === 'delete') {
    require_owner();
    $id = (int) param('id', 0);
    $stmt = db()->prepare('DELETE FROM leads WHERE id = ?');
    $stmt->execute([$id]);
    log_activity("Lead #$id deleted", $user['email']);
    ok();
}

if ($action === 'stats') {
    if ($user['role'] === 'agent') {
        $stmt = db()->prepare("SELECT status, COUNT(*) c FROM leads WHERE assigned_to = ? GROUP BY status");
        $stmt->execute([$user['email']]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = db()->query("SELECT status, COUNT(*) c FROM leads GROUP BY status")->fetchAll();
    }
    $stats = ['total' => 0, 'new' => 0, 'wip' => 0, 'success' => 0, 'rejected' => 0];
    foreach ($rows as $r) { $stats[$r['status']] = (int) $r['c']; $stats['total'] += (int) $r['c']; }
    ok(['stats' => $stats]);
}

fail('Unknown action.', 404);
