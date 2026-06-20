<?php
/**
 * One-time installer.
 * Visit https://yourdomain.com/api/install.php ONCE after importing schema.sql.
 * It creates the default owner account with a correctly hashed password.
 * DELETE this file after running it.
 */
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

$email = 'support@crownwealthadvisor.com';
$plain = 'Crown@123';
$name  = 'Owner';

try {
    // Ensure at least the users table exists
    $hash = password_hash($plain, PASSWORD_BCRYPT);

    $exists = db()->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute([$email]);

    if ($exists->fetch()) {
        $upd = db()->prepare('UPDATE users SET password_hash = ?, role = "owner", status = "active" WHERE email = ?');
        $upd->execute([$hash, $email]);
        echo "Owner account already existed - password reset to default.\n";
    } else {
        $ins = db()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "owner")');
        $ins->execute([$name, $email, $hash]);
        echo "Owner account created.\n";
    }

    echo "\nLogin details:\n";
    echo "  Email:    $email\n";
    echo "  Password: $plain\n";
    echo "\nIMPORTANT: Delete api/install.php now, and change your password after login.\n";
} catch (Exception $e) {
    http_response_code(500);
    echo "Install failed: " . $e->getMessage() . "\n";
    echo "Make sure you imported api/schema.sql and filled api/config.php first.\n";
}
