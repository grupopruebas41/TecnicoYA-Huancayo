<?php

namespace App\Modules\ARequests\Application;

use App\Modules\ARequests\Domain\TargetTechnicianOffers;
use App\Modules\ARequests\Http\Requests\StoreServiceRequestRequest;
use App\Modules\FAdministration\Domain\ActiveSubcategory;
use App\Shared\Http\ApiResponse;
use App\Shared\Rules\RuleBook;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Condiciones del quinto paso (SEC-S03-03): lo que era válido al registrar puede haber cambiado. Revalida
 * subcategoría, distrito, técnico objetivo e inicio programado (D-55) y aplica el máximo de solicitudes
 * activas de la versión de reglas vigente (D-11, D-58). Se ejecuta con la solicitud ya bloqueada.
 */
final class SubmissionPolicy
{
    public function __construct(private readonly RuleBook $rules) {}

    /** @return int versión de reglas que conservará la solicitud (D-24) */
    public function check(object $request): int
    {
        Validator::make((array) $request, [
            'subcategory_id' => [new ActiveSubcategory('api.subcategory_unavailable')],
            'district_id' => [Rule::exists('districts', 'id')->where('active', 1)],
            'target_technician_id' => ['exclude_unless:source,profile', new TargetTechnicianOffers($request->subcategory_id)],
            'preferred_start_at' => ['exclude_unless:mode,scheduled', 'after_or_equal:now'],
        ], StoreServiceRequestRequest::sharedMessages())->validate();

        // Serializa los envíos del mismo cliente para que dos solicitudes no superen juntas el máximo.
        DB::table('client_profiles')->where('id', $request->client_id)->lockForUpdate()->first();
        $versionId = $this->rules->currentVersionId();
        $max = $this->rules->integer($versionId, 'max_active_requests_per_client');
        $active = DB::table('service_requests')->where('client_id', $request->client_id)->where('status', '<>', 'registered')
            ->whereNull('closed_at')->whereNull('cancelled_at')->count();
        if ($active >= $max) {
            throw new HttpResponseException(ApiResponse::error('ACTIVE_REQUEST_LIMIT', __('api.active_request_limit', ['max' => $max]), 409));
        }

        return $versionId;
    }
}
