<?php
/**
 * Image Upload API (admin only)
 *   POST ?action=image  { dataUrl: "data:image/jpeg;base64,...." }
 *
 * The client compresses the image below 500KB (Canvas) and sends the data URL.
 * We decode it, save a .jpg file into /uploads/blogs/ and return its public URL.
 * The DB only stores the URL (lightweight) - the file lives on Hostinger disk.
 */
require_once __DIR__ . '/helpers.php';
allow_cors();
$user = require_login();

$dataUrl = (string) param('dataUrl', '');
if ($dataUrl === '' || strpos($dataUrl, 'base64,') === false) {
    fail('No image data received.');
}

// Parse mime + payload
if (!preg_match('#^data:image/(\w+);base64,#', $dataUrl, $m)) {
    fail('Invalid image format.');
}
$ext = strtolower($m[1]);
if ($ext === 'jpeg') $ext = 'jpg';
if (!in_array($ext, ['jpg', 'png', 'webp', 'gif'], true)) fail('Unsupported image type.');

$payload = substr($dataUrl, strpos($dataUrl, 'base64,') + 7);
$binary  = base64_decode($payload, true);
if ($binary === false) fail('Could not decode image.');

if (strlen($binary) > MAX_UPLOAD_BYTES) {
    fail('Image too large after compression. Please use a smaller image.');
}

// Ensure upload dir exists
if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}
if (!is_dir(UPLOAD_DIR) || !is_writable(UPLOAD_DIR)) {
    fail('Upload folder is not writable. Set permissions to 755 on /uploads/blogs/.', 500);
}

$filename = 'blog_' . date('Ymd_His') . '_' . substr(md5(uniqid('', true)), 0, 8) . '.' . $ext;
$path = UPLOAD_DIR . $filename;

if (file_put_contents($path, $binary) === false) {
    fail('Failed to save image.', 500);
}

$publicUrl = UPLOAD_URL . $filename;   // e.g. uploads/blogs/blog_...jpg
log_activity("Uploaded blog image $filename", $user['email']);
ok(['url' => $publicUrl, 'size' => strlen($binary)]);
