<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MarketplaceController;
use App\Modules\ARequests\Http\Controllers\ServiceRequestController;
use App\Modules\FAdministration\Http\Controllers\AdminCatalogController;
use App\Modules\FAdministration\Http\Controllers\AnnouncementController;
use App\Modules\FAdministration\Http\Controllers\MediaController;
use App\Modules\FAdministration\Http\Controllers\ProfileController;
use App\Modules\FAdministration\Http\Controllers\TechnicianProfileController;
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
    Route::get('catalog/specialties', [App\Modules\FAdministration\Http\Controllers\CatalogController::class, 'specialties']);
    Route::get('catalog/subcategories', [App\Modules\FAdministration\Http\Controllers\CatalogController::class, 'subcategories']);
    Route::middleware('throttle:spa-auth')->group(function () {
        Route::post('auth/register', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'register'])
            ->middleware('session.none'); // D-43
        Route::post('auth/login', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'login']);
    });
    Route::post('auth/logout', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
    // Público: imágenes revisadas; los archivos privados exigen sesión y relación (MediaController).
    Route::get('media/{media}', [MediaController::class, 'show'])->whereNumber('media');
    Route::get('technicians/{technician}/portfolio', [TechnicianProfileController::class, 'portfolio'])->whereNumber('technician');
    Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
        Route::get('me', [ProfileController::class, 'show']);
        Route::patch('me', [ProfileController::class, 'update']);
        Route::get('announcements', [AnnouncementController::class, 'index']);

        Route::get('technicians/{technician}', [TechnicianProfileController::class, 'show'])->whereNumber('technician');

        // Solicitudes: el detalle valida la relación con la solicitud (titular; técnico notificado desde S4).
        Route::get('requests/{serviceRequest}', [ServiceRequestController::class, 'show'])->whereNumber('serviceRequest');
        Route::middleware('role:client')->group(function () {
            Route::get('requests', [ServiceRequestController::class, 'index']);
            Route::post('requests', [ServiceRequestController::class, 'store']);
            Route::patch('requests/{serviceRequest}', [ServiceRequestController::class, 'update'])->whereNumber('serviceRequest');
            Route::post('requests/{serviceRequest}/attachments', [ServiceRequestController::class, 'attach'])->whereNumber('serviceRequest');
            Route::delete('requests/{serviceRequest}/attachments/{media}', [ServiceRequestController::class, 'detach'])
                ->whereNumber(['serviceRequest', 'media']);
            Route::post('requests/{serviceRequest}/submission', [ServiceRequestController::class, 'submit'])->whereNumber('serviceRequest');
        });

        Route::prefix('technicians/me')->middleware('role:technician')->group(function () {
            Route::put('availability', [TechnicianProfileController::class, 'availability']);
            Route::put('services', [TechnicianProfileController::class, 'services']);
            Route::post('portfolio', [TechnicianProfileController::class, 'storePortfolio']);
        });

        Route::prefix('admin')->group(function () {
            Route::middleware('permission:catalog.manage')->group(function () {
                Route::post('subcategories', [AdminCatalogController::class, 'storeSubcategory']);
                Route::patch('subcategories/{subcategory}', [AdminCatalogController::class, 'updateSubcategory'])->whereNumber('subcategory');
            });
            Route::post('announcements/{announcement}/duplicates', [AnnouncementController::class, 'duplicate'])
                ->middleware('permission:announcements.manage');
            Route::post('technicians/{technician}/reviews', [TechnicianProfileController::class, 'review'])
                ->whereNumber('technician')->middleware('permission:technicians.verify');
        });
    });
});
