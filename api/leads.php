<?php
/**
 * Leads API
 *   POST ?action=create  (PUBLIC) name, mobile, email, address, city, state, pincode, service, sub_service, message, source
 *   GET  ?action=list   [&status=&search=]
 *   GET  ?action=get&id=
 *   POST ?action=update  (full) all editable fields
 *   POST ?action=status  { id, status }
 *   POST ?action=assign  { id, assigned_to }   (full) sets assigned_date
 *   POST ?action=followup { id, next_follow_up, last_follow_up }
 *   POST ?action=comment { id, text }
 *   POST ?action=delete  { id }   (full)
 *   POST ?action=import  { rows }  (full)
 *   GET  ?action=stats
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'list');

$VALID_STATUSES = ['new','contacted','follow_up','documents_pending','processing','approved','converted','closed','rejected'];

// Helper: ensure an agent owns the lead they are modifying
function agent_can_touch($user, $leadId) {
    if ($user['role'] !== 'agent') return true;
    $s = db()->prepare('SELECT assigned_to FROM leads WHERE id = ?');
    $s->execute([$leadId]);
    $row = $s->fetch();
    return $row && $row['assigned_to'] === $user['email'];
}

// ---- PUBLIC: create lead from website forms ----
if ($action === 'create') {
    // Rate limit: max 10 form submissions per IP per 5 min
    require_once __DIR__ . '/rate-limiter.php';
    $rl = rate_limit_check('lead_create', 10, 300);
    if ($rl['blocked']) fail('Too many submissions. Please wait a few minutes.', 429);

    // reCAPTCHA check (if configured)
    require_once __DIR__ . '/captcha.php';
    if (!verify_captcha()) fail('Security verification failed. Please try again.', 403);

    $name = trim((string) param('name', ''));
    if ($name === '') $name = trim((string) param('fullName', ''));
    $mobile = trim((string) param('mobile', param('phone', '')));
    if ($name === '' && $mobile === '') fail('Name or mobile is required.');

    $stmt = db()->prepare(
        'INSERT INTO leads (name, mobile, email, address, city, state, pincode, service, sub_service, message, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "new")'
    );
    $stmt->execute([
        $name !== '' ? $name : 'Unknown',
        $mobile,
        trim((string) param('email', '')),
        trim((string) param('address', '')),
        trim((string) param('city', '')),
        trim((string) param('state', '')),
        trim((string) param('pincode', '')),
        trim((string) param('service', param('serviceType', 'General Inquiry'))),
        trim((string) param('sub_service', '')),
        trim((string) param('message', '')),
        trim((string) param('source', 'website')),
    ]);
    $id = (int) db()->lastInsertId();
    log_activity("New lead #$id from $name", 'website');
    ok(['id' => $id]);
}

// ---- Everything below requires login ----
$user = require_login();

// ---- Full control: edit existing lead ----
if ($action === 'update') {
    require_full();
    $id = (int) param('id', 0);
    $stmt = db()->prepare(
        'UPDATE leads SET name=?, mobile=?, email=?, address=?, city=?, state=?, pincode=?, service=?, sub_service=?, message=? WHERE id=?'
    );
    $stmt->execute([
        trim((string) param('name', '')),
        trim((string) param('mobile', '')),
        trim((string) param('email', '')),
        trim((string) param('address', '')),
        trim((string) param('city', '')),
        trim((string) param('state', '')),
        trim((string) param('pincode', '')),
        trim((string) param('service', '')),
        trim((string) param('sub_service', '')),
        trim((string) param('message', '')),
        $id,
    ]);
    log_activity("Lead #$id edited", $user['email']);
    ok();
}

// ---- Follow-up dates ----
if ($action === 'followup') {
    $id = (int) param('id', 0);
    if (!agent_can_touch($user, $id)) fail('You can only update leads assigned to you.', 403);
    $next = trim((string) param('next_follow_up', ''));
    $last = trim((string) param('last_follow_up', ''));
    $sets = []; $args = [];
    // next: empty string clears it
    $sets[] = 'next_follow_up = ?'; $args[] = ($next === '' ? null : $next);
    if ($last !== '') { $sets[] = 'last_follow_up = ?'; $args[] = $last; }
    $args[] = $id;
    db()->prepare('UPDATE leads SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    log_activity("Lead #$id follow-up updated", $user['email']);
    ok();
}

// ---- Full control: import rows ----
if ($action === 'import') {
    require_full();
    $rows = param('rows', []);
    if (!is_array($rows) || count($rows) === 0) fail('No rows to import.');
    $stmt = db()->prepare(
        'INSERT INTO leads (name, mobile, email, address, city, state, pincode, service, sub_service, message, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "new")'
    );
    $count = 0;
    foreach ($rows as $r) {
        if (!is_array($r)) continue;
        $g = function($k) use ($r) { return trim((string) (isset($r[$k]) ? $r[$k] : '')); };
        $name = $g('name'); $mobile = $g('mobile');
        if ($name === '' && $mobile === '') continue;
        $stmt->execute([
            $name !== '' ? $name : 'Unknown', $mobile, $g('email'), $g('address'),
            $g('city'), $g('state'), $g('pincode'),
            $g('service') !== '' ? $g('service') : 'Imported', $g('sub_service'),
            $g('message'), 'import',
        ]);
        $count++;
    }
    log_activity("Imported $count leads", $user['email']);
    ok(['imported' => $count]);
}

if ($action === 'list') {
    $status = param('status', '');
    $search = trim((string) param('search', ''));
    $sql = 'SELECT * FROM leads WHERE 1=1';
    $args = [];
    if ($user['role'] === 'agent') { $sql .= ' AND assigned_to = ?'; $args[] = $user['email']; }
    if ($status && in_array($status, $VALID_STATUSES, true)) { $sql .= ' AND status = ?'; $args[] = $status; }
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
    if ($user['role'] === 'agent' && $lead['assigned_to'] !== $user['email']) {
        fail('You can only view leads assigned to you.', 403);
    }
    $c = db()->prepare('SELECT text, by_user, created_at FROM lead_comments WHERE lead_id = ? ORDER BY created_at ASC');
    $c->execute([$id]);
    $lead['comments'] = $c->fetchAll();
    ok(['lead' => $lead]);
}

if ($action === 'status') {
    $id = (int) param('id', 0);
    $status = (string) param('status', '');
    if (!in_array($status, $VALID_STATUSES, true)) fail('Invalid status.');
    if (!agent_can_touch($user, $id)) fail('You can only update leads assigned to you.', 403);
    db()->prepare('UPDATE leads SET status = ? WHERE id = ?')->execute([$status, $id]);
    log_activity("Lead #$id status -> $status", $user['email']);
    ok();
}

if ($action === 'assign') {
    if ($user['role'] === 'agent') fail('Agents cannot assign leads.', 403);
    $id = (int) param('id', 0);
    $to = trim((string) param('assigned_to', ''));
    db()->prepare('UPDATE leads SET assigned_to = ?, assigned_date = NOW() WHERE id = ?')->execute([$to, $id]);
    log_activity("Lead #$id assigned to $to", $user['email']);
    ok();
}

if ($action === 'comment') {
    $id = (int) param('id', 0);
    $text = trim((string) param('text', ''));
    if ($text === '') fail('Comment text is required.');
    if (!agent_can_touch($user, $id)) fail('You can only comment on leads assigned to you.', 403);
    db()->prepare('INSERT INTO lead_comments (lead_id, text, by_user) VALUES (?, ?, ?)')->execute([$id, $text, $user['email']]);
    log_activity("Comment on lead #$id", $user['email']);
    ok();
}

if ($action === 'delete') {
    require_full();
    $id = (int) param('id', 0);
    db()->prepare('DELETE FROM leads WHERE id = ?')->execute([$id]);
    log_activity("Lead #$id deleted", $user['email']);
    ok();
}

if ($action === 'stats') {
    $isAgent = ($user['role'] === 'agent');
    if ($isAgent) {
        $stmt = db()->prepare("SELECT status, COUNT(*) c FROM leads WHERE assigned_to = ? GROUP BY status");
        $stmt->execute([$user['email']]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = db()->query("SELECT status, COUNT(*) c FROM leads GROUP BY status")->fetchAll();
    }
    $stats = ['total' => 0];
    foreach ($VALID_STATUSES as $s) { $stats[$s] = 0; }
    foreach ($rows as $r) { $stats[$r['status']] = (int) $r['c']; $stats['total'] += (int) $r['c']; }
    // Derived buckets
    $stats['converted'] = $stats['converted'];
    $stats['open'] = $stats['new'] + $stats['contacted'] + $stats['follow_up'] + $stats['documents_pending'] + $stats['processing'] + $stats['approved'];
    $stats['closed'] = $stats['closed'] + $stats['rejected'];

    // Follow-ups due today (agent = own, full = all)
    if ($isAgent) {
        $f = db()->prepare("SELECT COUNT(*) c FROM leads WHERE assigned_to = ? AND next_follow_up = CURDATE()");
        $f->execute([$user['email']]);
    } else {
        $f = db()->query("SELECT COUNT(*) c FROM leads WHERE next_follow_up = CURDATE()");
    }
    $stats['followup_today'] = (int) $f->fetch()['c'];

    ok(['stats' => $stats]);
}

fail('Unknown action.', 404);
