<?php
/**
 * reCAPTCHA v3 verification helper.
 * If RECAPTCHA_SECRET_KEY is empty, captcha is DISABLED (all pass).
 * Call verify_captcha() in any public form endpoint. It reads 'captcha_token' param.
 */
require_once __DIR__ . '/config.php';

function verify_captcha($minScore = 0.5) {
    $secret = defined('RECAPTCHA_SECRET_KEY') ? RECAPTCHA_SECRET_KEY : '';
    if ($secret === '') return true; // captcha disabled

    $token = isset($_POST['captcha_token']) ? $_POST['captcha_token'] : '';
    if ($token === '') {
        // Also check JSON body
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if (is_array($json) && isset($json['captcha_token'])) $token = $json['captcha_token'];
    }
    if ($token === '') return false; // no token sent

    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = ['secret' => $secret, 'response' => $token];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $result = curl_exec($ch);
    curl_close($ch);

    if (!$result) return true; // if Google unreachable, don't block (graceful degradation)

    $resp = json_decode($result, true);
    if (!$resp || !isset($resp['success'])) return true;

    return ($resp['success'] === true && (isset($resp['score']) ? $resp['score'] >= $minScore : true));
}
