<?php
/**
 * Settings API (key-value), admin read, owner write
 *   GET  ?action=all
 *   POST ?action=save { key, value }
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'all');
$user = require_login();

if ($action === 'all') {
    $rows = db()->query('SELECT skey, sval FROM settings')->fetchAll();
    $out = [];
    foreach ($rows as $r) { $out[$r['skey']] = $r['sval']; }
    ok(['settings' => $out]);
}

if ($action === 'save') {
    require_owner();
    $key = trim((string) param('key', ''));
    $val = (string) param('value', '');
    if ($key === '') fail('Key is required.');
    db()->prepare('INSERT INTO settings (skey, sval) VALUES (?, ?) ON DUPLICATE KEY UPDATE sval = VALUES(sval)')
        ->execute([$key, $val]);
    log_activity("Setting '$key' updated", $user['email']);
    ok();
}

fail('Unknown action.', 404);
