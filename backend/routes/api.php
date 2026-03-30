<?php

use App\Http\Controllers\PublicContentController;
use App\Http\Controllers\Admin\AboutController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\TeamMemberController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\EditalController;
use App\Http\Controllers\Admin\ContactSectionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\ContactController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rotas públicas — consumidas pelo frontend (sem autenticação).
|
*/

// Produtos ativos para a loja
Route::get('/products', [ProductController::class, 'publicIndex']);
// Detalhes públicos de um produto
Route::get('/products/{product}', [ProductController::class, 'publicShow']);
// Eventos públicos (lista de eventos ativos)
Route::get('/events', [EventController::class, 'publicIndex']);

// Configurações públicas (nome da gestão, hero, sobre)
Route::get('/settings', [SettingController::class, 'publicShow']);

// Conteúdo público agregado da home
Route::get('/content', [PublicContentController::class, 'index']);

// Envio do formulário de contato
Route::post('/contacts', [ContactController::class, 'store']);

// Autenticação do painel admin
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('api.token')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

/*
|--------------------------------------------------------------------------
| Rotas administrativas (API)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware('api.token')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('about', [AboutController::class, 'show']);
    Route::put('about', [AboutController::class, 'update']);
    Route::post('about', [AboutController::class, 'update']);

    Route::apiResource('team-members', TeamMemberController::class)->except(['create', 'edit', 'show']);
    Route::apiResource('services', ServiceController::class)->except(['create', 'edit', 'show']);
    Route::apiResource('projects', ProjectController::class)->except(['create', 'edit', 'show']);
    Route::apiResource('editals', EditalController::class)->except(['create', 'edit', 'show']);

    Route::apiResource('products', ProductController::class)->except(['create', 'edit']);
    Route::apiResource('events', EventController::class)->except(['create', 'edit', 'show']);

    Route::get('contacts', [ContactController::class, 'index']);
    Route::get('contacts/{contact}', [ContactController::class, 'show']);
    Route::delete('contacts/{contact}', [ContactController::class, 'destroy']);
    Route::apiResource('users', UserController::class)->except(['create', 'edit', 'show']);
    Route::get('contact-section', [ContactSectionController::class, 'show']);
    Route::put('contact-section', [ContactSectionController::class, 'update']);

    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);
});
