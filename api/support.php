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

// Save a base64 data-URL attachment to the tickets folder; returns public URL or '' 
function save_ticket_attachment($dataUrl) {
    if (!$dataUrl || strpos($dataUrl, 'base64,') === false) return '';
    if (!preg_match('#^data:([\w/+.\-]+);base64,#', $dataUrl, $m)) return '';
    $mime = strtolower($m[1]);
    $extMap = [
        'image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/png' => 'png',
        'image/webp' => 'webp', 'application/pdf' => 'pdf'
    ];
    if (!isset($extMap[$mime])) return '';
    $ext = $extMap[$mime];
    $payload = substr($dataUrl, strpos($dataUrl, 'base64,') + 7);
    $binary = base64_decode($payload, true);
    if ($binary === false) return '';
    if (strlen($binary) > MAX_TICKET_UPLOAD_BYTES) return ''; // too big - silently skip
    if (!is_dir(TICKET_UPLOAD_DIR)) @mkdir(TICKET_UPLOAD_DIR, 0755, true);
    if (!is_dir(TICKET_UPLOAD_DIR) || !is_writable(TICKET_UPLOAD_DIR)) return '';
    $filename = 'ticket_' . date('Ymd_His') . '_' . substr(md5(uniqid('', true)), 0, 8) . '.' . $ext;
    if (file_put_contents(TICKET_UPLOAD_DIR . $filename, $binary) === false) return '';
    return TICKET_UPLOAD_URL . $filename;
}

function ticket_agent_can_touch($user, $ticketId) {
    if ($user['role'] !== 'agent') return true;
    $s = db()->prepare('SELECT assigned_to FROM support_tickets WHERE id = ?');
    $s->execute([$ticketId]);
    $row = $s->fetch();
    return $row && $row['assigned_to'] === $user['email'];
}

// ---- PUBLIC: create a support ticket ----
if ($action === 'create') {
    // Rate limit: max 5 tickets per IP per 10 min
    require_once __DIR__ . '/rate-limiter.php';
    $rl = rate_limit_check('ticket_create', 5, 600);
    if ($rl['blocked']) fail('Too many submissions. Please wait a few minutes.', 429);

    // reCAPTCHA check (if configured)
    require_once __DIR__ . '/captcha.php';
    if (!verify_captcha()) fail('Security verification failed. Please try again.', 403);

    $name = trim((string) param('name', ''));
    $mobile = trim((string) param('mobile', ''));
    if ($name === '' && $mobile === '') fail('Name or mobile is required.');
    $attachment = save_ticket_attachment((string) param('attachment', ''));
    $stmt = db()->prepare(
        'INSERT INTO support_tickets (name, mobile, email, insurance_company, policy_number, issue_type, description, attachment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, "new")'
    );
    $stmt->execute([
        $name !== '' ? $name : 'Unknown',
        $mobile,
        trim((string) param('email', '')),
        trim((string) param('insurance_company', '')),
        trim((string) param('policy_number', '')),
        trim((string) param('issue_type', 'General')),
        trim((string) param('description', '')),
        $attachment,
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
