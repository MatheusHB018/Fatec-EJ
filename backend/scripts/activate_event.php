<?php
// Script para ativar um evento existente ou criar um evento de teste
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
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed', 'error' => $e->getMessage()]);
    exit(1);
}

try {
    // Tentar encontrar um evento existente
    $stmt = $pdo->query('SELECT * FROM events ORDER BY id DESC LIMIT 1');
    $event = $stmt->fetch();
    $now = date('Y-m-d H:i:s');

    if ($event) {
        // Atualiza para is_active = 1, ajustar datas se necessário
        $start = date('Y-m-d');
        $end = date('Y-m-d', strtotime('+7 days'));
        $pdo->prepare('UPDATE events SET is_active = 1, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?')
            ->execute([$start, $end, $now, $event['id']]);

        $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$event['id']]);
        $updated = $stmt->fetch();

        echo json_encode(['status' => 'ok', 'action' => 'updated', 'event' => $updated]);
        exit(0);
    }

    // Sem eventos — criar um de teste
    $title = 'Evento de Teste - EJ FATEC';
    $description = 'Evento criado automaticamente para testes.';
    $start = date('Y-m-d');
    $end = date('Y-m-d', strtotime('+7 days'));
    $location = 'Online';
    $registration_type = 'participante';
    $entry_type = 'gratuita';
    $modality = 'online';
    $category = 'Teste';
    $price = null;
    $quantity = 100;
    $valid_from = $start;
    $valid_to = $end;
    $pix_key = null;
    $is_active = 1;

    $insert = $pdo->prepare('INSERT INTO events (title, description, start_date, end_date, location, registration_type, entry_type, modality, category, price, quantity, valid_from, valid_to, pix_key, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $insert->execute([$title, $description, $start, $end, $location, $registration_type, $entry_type, $modality, $category, $price, $quantity, $valid_from, $valid_to, $pix_key, $is_active, $now, $now]);
    $id = $pdo->lastInsertId();

    $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
    $stmt->execute([$id]);
    $created = $stmt->fetch();

    echo json_encode(['status' => 'ok', 'action' => 'created', 'event' => $created]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Query failed', 'error' => $e->getMessage()]);
    exit(1);
}
