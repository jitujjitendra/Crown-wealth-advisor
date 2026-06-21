<?php
/**
 * Simple file-based rate limiter (no Redis/Memcached needed on shared hosting).
 * Stores attempt counts in /tmp/ per IP. Auto-expires.
 */

function rate_limit_check($action = 'general', $maxAttempts = 100, $windowSeconds = 60) {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $key = md5($ip . '_' . $action);
    $file = sys_get_temp_dir() . '/cwa_rate_' . $key;

    $attempts = 0;
    $windowStart = time();

    if (file_exists($file)) {
        $data = @json_decode(file_get_contents($file), true);
        if ($data && isset($data['start']) && (time() - $data['start']) < $windowSeconds) {
            $attempts = (int) $data['count'];
            $windowStart = (int) $data['start'];
        } else {
            // Window expired, reset
            @unlink($file);
        }
    }

    if ($attempts >= $maxAttempts) {
        $remaining = $windowSeconds - (time() - $windowStart);
        return ['blocked' => true, 'retry_after' => $remaining];
    }

    // Increment
    $attempts++;
    @file_put_contents($file, json_encode(['count' => $attempts, 'start' => $windowStart ?: time()]));

    return ['blocked' => false, 'attempts' => $attempts];
}

function rate_limit_reset($action = 'general') {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $key = md5($ip . '_' . $action);
    $file = sys_get_temp_dir() . '/cwa_rate_' . $key;
    @unlink($file);
}
