<?php
// Faz login e cria um produto via API admin

$base = 'http://localhost/Fatec-EJ/backend/public/api';

function curl_post($url, $data, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge(['Content-Type: application/json'], $headers));
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $resp = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    return [$info['http_code'], $resp];
}

// 1) login
list($http, $body) = curl_post($base . '/auth/login', ['email' => 'admin@ejfatec.com.br', 'password' => 'admin123']);
echo "Login HTTP $http\n";
echo $body . "\n";
if ($http !== 200) exit(1);
$payload = json_decode($body, true);
if (! isset($payload['token'])) { echo "No token returned\n"; exit(2); }
$token = $payload['token'];

// 2) create product
$product = [
    'name' => 'Teste Produto API',
    'description' => 'Especificação do produto de teste.',
    'price' => 49.90,
    'coupon_code' => 'PROMO10',
    'coupon_discount' => 10.00,
    'is_active' => true,
];

$headers = ['Authorization: Bearer ' . $token];
$ch = curl_init($base . '/admin/products');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge(['Content-Type: application/json'], $headers));
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($product));
$resp = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "Create HTTP " . $info['http_code'] . "\n";
echo $resp . "\n";
