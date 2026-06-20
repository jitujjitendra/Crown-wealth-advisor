<?php
/**
 * Blogs API
 *   GET  ?action=published                     (PUBLIC - approved blogs for website)
 *   GET  ?action=get&id=                        (PUBLIC if approved, else admin)
 *   GET  ?action=list [&status=]                (admin)
 *   POST ?action=save  { id?, title, category, tags, content, featured_image, meta_description, status } (admin)
 *   POST ?action=approve { id }                 (admin)
 *   POST ?action=reject  { id, reason }         (admin)
 *   POST ?action=delete  { id }                 (owner)
 */
require_once __DIR__ . '/helpers.php';
allow_cors();

$action = param('action', 'published');

function make_excerpt($html, $len = 160) {
    $text = trim(preg_replace('/\s+/', ' ', strip_tags($html)));
    if (strlen($text) <= $len) return $text;
    return substr($text, 0, $len) . '...';
}
function make_slug($title) {
    $s = strtolower(trim($title));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}
// Link a blog to a topic and update topic status based on blog status
function link_topic($topicId, $blogId, $blogStatus) {
    $tstatus = ($blogStatus === 'pending') ? 'submitted' : (($blogStatus === 'approved') ? 'done' : 'in_progress');
    db()->prepare('UPDATE blog_topics SET blog_id = ?, status = ? WHERE id = ?')->execute([$blogId, $tstatus, $topicId]);
    db()->prepare('UPDATE blogs SET topic_id = ? WHERE id = ?')->execute([$topicId, $blogId]);
}
// When a blog is approved/published, mark its linked topic done
function topic_done_for_blog($blogId) {
    db()->prepare("UPDATE blog_topics SET status='done' WHERE blog_id = ?")->execute([$blogId]);
}

// ---- PUBLIC: approved blogs for website ----
if ($action === 'published') {
    $stmt = db()->query("SELECT id, title, slug, category, tags, excerpt, featured_image, created_at
                         FROM blogs WHERE status = 'approved' ORDER BY COALESCE(approved_at, created_at) DESC LIMIT 50");
    ok(['blogs' => $stmt->fetchAll()]);
}

if ($action === 'get') {
    $id = (int) param('id', 0);
    $stmt = db()->prepare('SELECT * FROM blogs WHERE id = ?');
    $stmt->execute([$id]);
    $blog = $stmt->fetch();
    if (!$blog) fail('Blog not found.', 404);
    // If not approved, require login
    if ($blog['status'] !== 'approved' && !current_user()) fail('Not authorized.', 403);
    ok(['blog' => $blog]);
}

// ---- Admin actions below ----
$user = require_login();

if ($action === 'list') {
    $status = param('status', '');
    if ($status && in_array($status, ['draft','pending','approved','rejected'], true)) {
        $stmt = db()->prepare('SELECT * FROM blogs WHERE status = ? ORDER BY created_at DESC');
        $stmt->execute([$status]);
    } else {
        $stmt = db()->query('SELECT * FROM blogs ORDER BY created_at DESC');
    }
    ok(['blogs' => $stmt->fetchAll()]);
}

if ($action === 'save') {
    $id     = (int) param('id', 0);
    $title  = trim((string) param('title', ''));
    if ($title === '') fail('Title is required.');
    $status = (string) param('status', 'pending');
    if (!in_array($status, ['draft','pending','approved','rejected'], true)) $status = 'pending';
    $content = (string) param('content', '');
    $topicId = (int) param('topic_id', 0);
    $data = [
        $title,
        make_slug($title),
        trim((string) param('category', 'General')),
        trim((string) param('tags', '')),
        $content,
        make_excerpt($content),
        trim((string) param('featured_image', '')),
        trim((string) param('meta_description', '')),
        $user['email'],
        $status,
    ];

    if ($id > 0) {
        // Agents may only edit their own blogs, and never edit an approved/published one
        if ($user['role'] === 'agent') {
            $own = db()->prepare('SELECT author, status FROM blogs WHERE id = ?');
            $own->execute([$id]);
            $row = $own->fetch();
            if (!$row || $row['author'] !== $user['email']) fail('You can only edit your own blogs.', 403);
            if ($row['status'] === 'approved') fail('You cannot edit a published blog.', 403);
            // Agents can only save as draft or pending
            if (!in_array($status, ['draft','pending'], true)) $status = 'pending';
            $data[9] = $status;
        }
        $sql = 'UPDATE blogs SET title=?, slug=?, category=?, tags=?, content=?, excerpt=?, featured_image=?, meta_description=?, author=?, status=? WHERE id=?';
        $data[] = $id;
        db()->prepare($sql)->execute($data);
        if ($topicId > 0) link_topic($topicId, $id, $status);
        log_activity("Blog #$id updated ($status)", $user['email']);
        ok(['id' => $id]);
    } else {
        // Agents can only create draft/pending blogs
        if ($user['role'] === 'agent' && !in_array($status, ['draft','pending'], true)) {
            $status = 'pending';
            $data[9] = $status;
        }
        $sql = 'INSERT INTO blogs (title, slug, category, tags, content, excerpt, featured_image, meta_description, author, status) VALUES (?,?,?,?,?,?,?,?,?,?)';
        db()->prepare($sql)->execute($data);
        $newId = (int) db()->lastInsertId();
        if ($topicId > 0) link_topic($topicId, $newId, $status);
        log_activity("Blog #$newId created ($status)", $user['email']);
        ok(['id' => $newId]);
    }
}

if ($action === 'approve') {
    require_full();
    $id = (int) param('id', 0);
    db()->prepare("UPDATE blogs SET status='approved', approved_at=NOW(), reject_reason='' WHERE id=?")->execute([$id]);
    topic_done_for_blog($id);
    log_activity("Blog #$id approved", $user['email']);
    ok();
}

if ($action === 'publish') {
    require_full();
    $id = (int) param('id', 0);
    db()->prepare("UPDATE blogs SET status='approved', approved_at=NOW(), reject_reason='' WHERE id=?")->execute([$id]);
    topic_done_for_blog($id);
    log_activity("Blog #$id published", $user['email']);
    ok();
}

if ($action === 'unpublish') {
    require_full();
    $id = (int) param('id', 0);
    // Move back to draft so it disappears from the public site but is not deleted
    db()->prepare("UPDATE blogs SET status='draft' WHERE id=?")->execute([$id]);
    log_activity("Blog #$id unpublished", $user['email']);
    ok();
}

if ($action === 'reject') {
    require_full();
    $id = (int) param('id', 0);
    $reason = trim((string) param('reason', ''));
    db()->prepare("UPDATE blogs SET status='rejected', reject_reason=? WHERE id=?")->execute([$reason, $id]);
    log_activity("Blog #$id rejected", $user['email']);
    ok();
}

if ($action === 'delete') {
    require_full();
    $id = (int) param('id', 0);
    db()->prepare('DELETE FROM blogs WHERE id=?')->execute([$id]);
    log_activity("Blog #$id deleted", $user['email']);
    ok();
}

fail('Unknown action.', 404);
