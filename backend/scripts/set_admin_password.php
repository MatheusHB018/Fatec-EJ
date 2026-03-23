<?php
// Atualiza a senha do usuário admin para 'admin123' (bcrypt)
$dsn = 'mysql:host=127.0.0.1;dbname=ej_fatec;charset=utf8mb4;port=3306';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $email = 'admin@ejfatec.com.br';
    $newPlain = 'admin123';
    $newHash = password_hash($newPlain, PASSWORD_BCRYPT, ['cost' => 12]);

    $stmt = $pdo->prepare("UPDATE users SET password = :hash WHERE email = :email");
    $stmt->execute(['hash' => $newHash, 'email' => $email]);

    if ($stmt->rowCount() > 0) {
        echo "UPDATED: password for {$email}\n";
        echo "New hash: {$newHash}\n";
        exit(0);
    }

    echo "NO_UPDATE: user not found or no change.\n";
    exit(2);

} catch (PDOException $e) {
    echo "DB_ERROR: " . $e->getMessage() . "\n";
    exit(3);
}
