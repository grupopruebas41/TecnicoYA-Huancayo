<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\OwnProfileView;
use App\Modules\FAdministration\Application\OwnTechnicianProfile;
use App\Modules\FAdministration\Application\Portfolio;
use App\Modules\FAdministration\Application\PublicTechnicianProfile;
use App\Modules\FAdministration\Application\TechnicianDocuments;
use App\Modules\FAdministration\Application\TechnicianHome;
use App\Modules\FAdministration\Application\TechnicianJobs;
use Carbon\CarbonImmutable;
use Illuminate\Validation\Rule;
use App\Modules\FAdministration\Http\Resources\AccountData;
use App\Modules\FAdministration\Application\TechnicianStatus;
use App\Modules\FAdministration\Application\UpdateAvailability;
use App\Modules\FAdministration\Application\UpdateServices;
use App\Modules\FAdministration\Application\UpdateTechnicianProfile;
use App\Modules\FAdministration\Http\Requests\StoreDocumentRequest;
use App\Modules\FAdministration\Http\Requests\StorePortfolioItemRequest;
use App\Modules\FAdministration\Http\Requests\UpdateAvailabilityRequest;
use App\Modules\FAdministration\Http\Requests\UpdateServicesRequest;
use App\Modules\FAdministration\Http\Requests\UpdateTechnicianProfileRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/** Perfil del técnico: lo propio (technicians/me, contrato S2 §5 y §6) y lo público de un técnico habilitado. */
final class TechnicianProfileController
{
    public function profile(Request $request, OwnTechnicianProfile $profiles, OwnProfileView $view): JsonResponse
    {
        return ApiResponse::data($view->for($profiles->idFor($request->user())));
    }

    /** Panel del técnico, Fase T2: Inicio (indicadores, Mi día, progreso, insignias y verificación). */
    public function home(Request $request, OwnTechnicianProfile $profiles, TechnicianHome $home): JsonResponse
    {
        return ApiResponse::data($home->for($profiles->idFor($request->user()), AccountData::from($request->user()->fresh())['avatar_url']));
    }

    /** Fase T3: Mis trabajos por pestaña, con conteos, búsqueda y paginación. */
    public function jobs(Request $request, OwnTechnicianProfile $profiles, TechnicianJobs $jobs): JsonResponse
    {
        $filters = $request->validate([
            'tab' => ['sometimes', Rule::in(TechnicianJobs::TABS)], 'q' => ['sometimes', 'nullable', 'string', 'max:60'],
            'page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:30'],
        ], ['tab.in' => __('api.jobs_tab'), 'q.max' => __('api.jobs_search')]);

        return ApiResponse::data($jobs->list($profiles->idFor($request->user()), $filters));
    }

    public function job(Request $request, int $serviceRequest, OwnTechnicianProfile $profiles, TechnicianJobs $jobs): JsonResponse
    {
        return ApiResponse::data($jobs->detail($profiles->idFor($request->user()), $serviceRequest));
    }

    /** Fase T3: Mi agenda, una semana de lunes a domingo (hora de Lima); sin fecha, la semana actual. */
    public function agenda(Request $request, OwnTechnicianProfile $profiles, TechnicianJobs $jobs): JsonResponse
    {
        $week = $request->validate(['week' => ['sometimes', 'date_format:Y-m-d']], ['week.date_format' => __('api.agenda_week')])['week'] ?? null;
        $day = $week ? CarbonImmutable::parse($week, TechnicianHome::TIMEZONE) : CarbonImmutable::now(TechnicianHome::TIMEZONE);

        return ApiResponse::data($jobs->agenda($profiles->idFor($request->user()), $day->startOfWeek(CarbonImmutable::MONDAY)));
    }

    public function updateProfile(UpdateTechnicianProfileRequest $request, UpdateTechnicianProfile $update, OwnProfileView $view): JsonResponse
    {
        return ApiResponse::data($view->for($update->execute($request->user(), $request->validated())));
    }

    public function requestVerification(Request $request, TechnicianStatus $status): JsonResponse
    {
        $data = $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);
        $profile = $status->requestReview($request->user(), (int) $data['expected_version']);

        return ApiResponse::data(['verification_status' => $profile->verification_status, 'version' => (int) $profile->version]);
    }

    public function storeDocument(StoreDocumentRequest $request, TechnicianDocuments $documents): JsonResponse
    {
        $document = $documents->store($request->user(), $request->validated());

        return ApiResponse::data([
            'id' => $document->id, 'document_type' => $document->document_type,
            'review_status' => $document->review_status, 'media_id' => $document->media_id,
        ], 201);
    }

    public function availability(UpdateAvailabilityRequest $request, UpdateAvailability $update): JsonResponse
    {
        return ApiResponse::data($update->execute($request->user(), $request->validated()));
    }

    public function services(UpdateServicesRequest $request, UpdateServices $update): JsonResponse
    {
        return ApiResponse::data($update->execute($request->user(), $request->validated()));
    }

    public function storePortfolio(StorePortfolioItemRequest $request, Portfolio $portfolio): JsonResponse
    {
        $item = $portfolio->store($request->user(), $request->validated());

        return ApiResponse::data(['id' => $item->id, 'status' => $item->status, 'version' => (int) $item->version], 201);
    }

    public function updatePortfolio(StorePortfolioItemRequest $request, int $item, Portfolio $portfolio): JsonResponse
    {
        return ApiResponse::data($portfolio->present($portfolio->update($request->user(), $item, $request->validated())));
    }

    public function retirePortfolio(Request $request, int $item, Portfolio $portfolio): Response
    {
        $portfolio->retire($request->user(), $item);

        return response()->noContent();
    }

    public function show(Request $request, int $technician, PublicTechnicianProfile $profile): JsonResponse
    {
        // D-101: la marca de favorito es solo la del cliente de la sesión.
        $client = DB::table('roles')->where('id', $request->user()->role_id)->value('code') === 'client' ? (int) $request->user()->id : null;

        return ApiResponse::data($profile->show($technician, $client));
    }

    public function portfolio(int $technician, Portfolio $portfolio): JsonResponse
    {
        return ApiResponse::data($portfolio->publicGallery($technician));
    }
}
