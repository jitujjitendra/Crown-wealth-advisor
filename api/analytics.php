<?php
/**
 * Analytics API (admin)
 *   GET ?action=summary                 -> stats + success rate + source breakdown
 *   GET ?action=trend&period=daily|weekly|monthly
 *   GET ?action=activity                -> recent activity log
 */
require_once __DIR__ . '/helpers.php';
allow_cors();
require_login();

$action = param('action', 'summary');

if ($action === 'summary') {
    // status counts
    $rows = db()->query("SELECT status, COUNT(*) c FROM leads GROUP BY status")->fetchAll();
    $stats = ['total' => 0, 'new' => 0, 'wip' => 0, 'success' => 0, 'rejected' => 0];
    foreach ($rows as $r) { $stats[$r['status']] = (int) $r['c']; $stats['total'] += (int) $r['c']; }

    // success rate
    $closed = $stats['success'] + $stats['rejected'];
    $rate    = $closed > 0 ? round(($stats['success'] / $closed) * 100) : 0;
    $overall = $stats['total'] > 0 ? round(($stats['success'] / $stats['total']) * 100) : 0;

    // source breakdown
    $srcRows = db()->query("SELECT source, COUNT(*) c FROM leads GROUP BY source ORDER BY c DESC")->fetchAll();
    $sources = [];
    foreach ($srcRows as $r) { $sources[$r['source'] ?: 'unknown'] = (int) $r['c']; }

    ok([
        'stats'      => $stats,
        'successRate'=> $rate,
        'overall'    => $overall,
        'sources'    => $sources,
        'open'       => $stats['new'] + $stats['wip'],
        'converted'  => $stats['success'],
    ]);
}

if ($action === 'agent_performance') {
    require_full();
    // Leads per agent with conversion counts
    $rows = db()->query(
        "SELECT u.name, u.email,
                COUNT(l.id) total,
                SUM(l.status='success') converted,
                SUM(l.status IN ('new','wip')) open_leads,
                SUM(l.status='rejected') rejected
         FROM users u
         LEFT JOIN leads l ON l.assigned_to = u.email
         WHERE u.role = 'agent'
         GROUP BY u.id, u.name, u.email
         ORDER BY converted DESC, total DESC"
    )->fetchAll();
    $perf = array_map(function($r) {
        $total = (int) $r['total'];
        $conv  = (int) $r['converted'];
        return [
            'name'      => $r['name'],
            'email'     => $r['email'],
            'total'     => $total,
            'open'      => (int) $r['open_leads'],
            'converted' => $conv,
            'rejected'  => (int) $r['rejected'],
            'rate'      => $total > 0 ? round(($conv / $total) * 100) : 0,
        ];
    }, $rows);
    ok(['agents' => $perf]);
}

if ($action === 'service_breakdown') {
    require_full();
    $rows = db()->query(
        "SELECT service, COUNT(*) total, SUM(status='success') converted
         FROM leads GROUP BY service ORDER BY total DESC"
    )->fetchAll();
    $out = array_map(function($r) {
        return [
            'service'   => $r['service'] ?: 'Unspecified',
            'total'     => (int) $r['total'],
            'converted' => (int) $r['converted'],
        ];
    }, $rows);
    ok(['services' => $out]);
}

if ($action === 'trend') {
    $period = (string) param('period', 'daily');

    if ($period === 'monthly') {
        // last 12 months
        $rows = db()->query(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') ym, COUNT(*) c
             FROM leads WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
             GROUP BY ym ORDER BY ym ASC"
        )->fetchAll();
        $map = [];
        foreach ($rows as $r) { $map[$r['ym']] = (int) $r['c']; }
        $out = [];
        for ($i = 11; $i >= 0; $i--) {
            $key = date('Y-m', strtotime("-$i months"));
            $out[] = ['label' => date('M y', strtotime($key . '-01')), 'count' => $map[$key] ?? 0];
        }
        ok(['trend' => $out]);
    }

    if ($period === 'weekly') {
        // last 12 weeks (group by ISO yearweek)
        $rows = db()->query(
            "SELECT YEARWEEK(created_at, 3) yw, COUNT(*) c
             FROM leads WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
             GROUP BY yw ORDER BY yw ASC"
        )->fetchAll();
        $map = [];
        foreach ($rows as $r) { $map[(string) $r['yw']] = (int) $r['c']; }
        $out = [];
        for ($i = 11; $i >= 0; $i--) {
            $ts = strtotime("-" . ($i * 7) . " days");
            $yw = date('oW', $ts); // ISO year+week, matches YEARWEEK mode 3 closely
            $label = 'W' . date('W', $ts);
            $out[] = ['label' => $label, 'count' => $map[$yw] ?? 0];
        }
        ok(['trend' => $out]);
    }

    // daily - last 30 days
    $rows = db()->query(
        "SELECT DATE(created_at) d, COUNT(*) c
         FROM leads WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY d ORDER BY d ASC"
    )->fetchAll();
    $map = [];
    foreach ($rows as $r) { $map[$r['d']] = (int) $r['c']; }
    $out = [];
    for ($i = 29; $i >= 0; $i--) {
        $key = date('Y-m-d', strtotime("-$i days"));
        $out[] = ['label' => date('m-d', strtotime($key)), 'count' => $map[$key] ?? 0];
    }
    ok(['trend' => $out]);
}

if ($action === 'activity') {
    $rows = db()->query('SELECT action, by_user, created_at FROM activity_log ORDER BY created_at DESC LIMIT 30')->fetchAll();
    ok(['activity' => $rows]);
}

fail('Unknown action.', 404);
