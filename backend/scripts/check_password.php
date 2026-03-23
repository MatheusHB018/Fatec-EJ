<?php
// Verifica se a senha 'admin123' bate com o hash do usuário admin no banco
$dsn = 'mysql:host=127.0.0.1;dbname=ej_fatec;charset=utf8mb4;port=3306';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare("SELECT id, email, password FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => 'admin@ejfatec.com.br']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (! $row) {
        echo "USER_NOT_FOUND\n";
        exit(1);
    }

    echo "Found user: " . $row['email'] . " (id=" . $row['id'] . ")\n";
    $hash = $row['password'];
    echo "Hash: " . $hash . "\n";

    $candidate = 'admin123';
    if (password_verify($candidate, $hash)) {
        echo "PASSWORD_MATCH: '" . $candidate . "' matches the hash.\n";
        exit(0);
    }

    echo "PASSWORD_MISMATCH: '" . $candidate . "' does NOT match the hash.\n";
    exit(2);

} catch (PDOException $e) {
    echo "DB_ERROR: " . $e->getMessage() . "\n";
    exit(3);
}
