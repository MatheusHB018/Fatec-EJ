<?php
$ch = curl_init('http://localhost/Fatec-EJ/backend/public/api/auth/login');
$data = json_encode(['email' => 'admin@ejfatec.com.br', 'password' => 'admin123']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
$response = curl_exec($ch);
if ($response === false) {
    echo "CURL_ERROR: " . curl_error($ch) . PHP_EOL;
    exit(1);
}
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP " . $http . PHP_EOL;
echo $response . PHP_EOL;
curl_close($ch);
