<?php

use App\Modules\ARequests\Http\Controllers\ServiceRequestController;
use App\Modules\BMatching\Http\Controllers\TechnicianSearchController;
use App\Modules\FAdministration\Http\Controllers\AdminAnnouncementController;
use App\Modules\FAdministration\Http\Controllers\AdminCatalogController;
use App\Modules\FAdministration\Http\Controllers\AdminTechnicianController;
use App\Modules\FAdministration\Http\Controllers\AnnouncementController;
use App\Modules\FAdministration\Http\Controllers\CatalogController;
use App\Modules\FAdministration\Http\Controllers\MediaController;
use App\Modules\FAdministration\Http\Controllers\ProfileController;
use App\Modules\FAdministration\Http\Controllers\TechnicianProfileController;
use Illuminate\Support\Facades\Route;

// El arrancador E2E la usa para saber si la API está lista. La API con token del prototipo se retiró (D-26, D-62).
Route::get('/health', fn () => ['status' => 'ok', 'service' => 'tecnicoya-laravel']);

Route::prefix('v1')->group(function () {
    Route::get('catalog/specialties', [CatalogController::class, 'specialties']);
    Route::get('catalog/subcategories', [CatalogController::class, 'subcategories']);
    Route::get('catalog/carousel', [CatalogController::class, 'carousel']);
    Route::get('catalog/districts', [CatalogController::class, 'districts']);
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
        Route::post('media', [MediaController::class, 'store']); // D-46 y D-47; StoreMediaRequest autoriza por finalidad.

        // Búsqueda (D-57: sin técnicos en pausa); el perfil por enlace sigue disponible.
        Route::get('technicians', [TechnicianSearchController::class, 'index']);
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
            Route::get('profile', [TechnicianProfileController::class, 'profile']);
            Route::patch('profile', [TechnicianProfileController::class, 'updateProfile']);
            Route::post('verification-request', [TechnicianProfileController::class, 'requestVerification']); // D-50
            Route::post('documents', [TechnicianProfileController::class, 'storeDocument']);
            Route::put('availability', [TechnicianProfileController::class, 'availability']);
            Route::put('services', [TechnicianProfileController::class, 'services']);
            Route::post('portfolio', [TechnicianProfileController::class, 'storePortfolio']);
            Route::patch('portfolio/{item}', [TechnicianProfileController::class, 'updatePortfolio'])->whereNumber('item');
            Route::delete('portfolio/{item}', [TechnicianProfileController::class, 'retirePortfolio'])->whereNumber('item');
        });

        Route::prefix('admin')->group(function () {
            Route::middleware('permission:catalog.manage')->group(function () {
                Route::get('specialties', [AdminCatalogController::class, 'specialties']);
                Route::post('specialties', [AdminCatalogController::class, 'storeSpecialty']);
                Route::patch('specialties/{specialty}', [AdminCatalogController::class, 'updateSpecialty'])->whereNumber('specialty');
                Route::post('subcategories', [AdminCatalogController::class, 'storeSubcategory']);
                Route::patch('subcategories/{subcategory}', [AdminCatalogController::class, 'updateSubcategory'])->whereNumber('subcategory');
                Route::get('districts', [AdminCatalogController::class, 'districts']);
                Route::post('districts', [AdminCatalogController::class, 'storeDistrict']);
                Route::patch('districts/{district}', [AdminCatalogController::class, 'updateDistrict'])->whereNumber('district');
            });
            Route::middleware('permission:announcements.manage')->group(function () {
                Route::get('announcements', [AdminAnnouncementController::class, 'index']);
                Route::post('announcements', [AdminAnnouncementController::class, 'store']);
                Route::patch('announcements/{announcement}', [AdminAnnouncementController::class, 'update']);
                Route::post('announcements/{announcement}/publication', [AdminAnnouncementController::class, 'publish']);
                Route::delete('announcements/{announcement}', [AdminAnnouncementController::class, 'retire']);
                Route::post('announcements/{announcement}/duplicates', [AnnouncementController::class, 'duplicate']);
            });
            Route::prefix('technicians')->middleware('permission:technicians.verify')->group(function () {
                Route::get('/', [AdminTechnicianController::class, 'index']);
                Route::get('{technician}', [AdminTechnicianController::class, 'show'])->whereNumber('technician');
                Route::post('{technician}/reviews', [AdminTechnicianController::class, 'review'])->whereNumber('technician');
                // D-32 y D-50: suspensión y reactivación con motivo; sin pantalla hasta el Sprint 7.
                Route::post('{technician}/suspension', [AdminTechnicianController::class, 'suspend'])->whereNumber('technician');
                Route::post('{technician}/reactivation', [AdminTechnicianController::class, 'reactivate'])->whereNumber('technician');
            });
        });
    });
});
