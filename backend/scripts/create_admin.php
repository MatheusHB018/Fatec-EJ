<?php
// Small script to create or update admin user directly via PDO
$host = '127.0.0.1';
$db   = 'ej_fatec';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (Exception $e) {
    echo json_encode(['error' => 'DB connection failed', 'message' => $e->getMessage()]);
    exit(1);
}

$email = 'admin@ejfatec.com.br';
$name = 'Admin EJ';
$password_plain = 'EJFatec!2026#';
$hash = password_hash($password_plain, PASSWORD_BCRYPT);
$now = date('Y-m-d H:i:s');

try {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if ($row) {
        $pdo->prepare('UPDATE users SET name = ?, password = ?, updated_at = ? WHERE id = ?')
            ->execute([$name, $hash, $now, $row['id']]);
        $id = $row['id'];
        $action = 'updated';
    } else {
        $pdo->prepare('INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
            ->execute([$name, $email, $hash, $now, $now]);
        $id = $pdo->lastInsertId();
        $action = 'created';
    }

    $stmt = $pdo->prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    echo json_encode(['status' => 'ok', 'action' => $action, 'user' => $user, 'temp_password' => $password_plain]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Query failed', 'message' => $e->getMessage()]);
    exit(1);
}
