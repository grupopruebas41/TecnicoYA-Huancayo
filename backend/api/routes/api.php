<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MarketplaceController;
use App\Modules\FAdministration\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok', 'service' => 'tecnicoya-laravel']);
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});
Route::middleware(['token', 'throttle:120,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/state', [MarketplaceController::class, 'state']);
    Route::post('/actions/{action}', [MarketplaceController::class, 'action']);
});

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:spa-auth')->group(function () {
        Route::post('auth/register', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'register']);
        Route::post('auth/login', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'login']);
    });
    Route::post('auth/logout', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
    Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
        Route::get('me', [ProfileController::class, 'show']);
        Route::patch('me', [ProfileController::class, 'update']);
    });
});
