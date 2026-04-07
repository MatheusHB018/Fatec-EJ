<?php

use App\Http\Controllers\FileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'Fatec-EJ Backend',
        'status' => 'ok',
    ]);
});

Route::get('/receipts/{filename}', [FileController::class, 'showReceipt'])
    ->where('filename', '[A-Za-z0-9._-]+');
