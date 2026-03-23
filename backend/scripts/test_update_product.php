<?php
// Login, create product, then update it to validate PUT /admin/products/{id}
$base = 'http://localhost/Fatec-EJ/backend/public/api';

function curl_json($url, $method = 'POST', $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = 'Authorization: Bearer ' . $token;
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($data !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $resp = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    return [$info['http_code'], $resp];
}

// 1. login
list($http, $body) = curl_json($base . '/auth/login', 'POST', ['email' => 'admin@ejfatec.com.br', 'password' => 'admin123']);
echo "Login HTTP $http\n";
if ($http !== 200) { echo $body; exit(1); }
$payload = json_decode($body, true);
$token = $payload['token'] ?? null;
if (! $token) { echo "No token\n"; exit(2); }

// 2. create product
$prod = ['name' => 'Produto para update', 'description' => 'Original', 'price' => 10.00, 'is_active' => true, 'category' => 'acessorio'];
list($http, $body) = curl_json($base . '/admin/products', 'POST', $prod, $token);
echo "Create HTTP $http\n";
echo $body . "\n";
if ($http !== 201) exit(3);
$created = json_decode($body, true)['data'] ?? null;
if (! $created) exit(4);
$id = $created['id'];

// 3. update
$update = ['name' => 'Produto atualizado via test', 'description' => 'Alterado', 'price' => 12.50, 'coupon_code' => 'UPD10', 'coupon_discount' => 2.50, 'is_active' => true, 'category' => 'vetuario'];
list($http, $body) = curl_json($base . "/admin/products/{$id}", 'PUT', $update, $token);
echo "Update HTTP $http\n";
echo $body . "\n";
