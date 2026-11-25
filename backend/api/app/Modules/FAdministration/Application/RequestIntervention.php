<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Modules\ARequests\Application\RequestCancellation;
use App\Modules\BMatching\Application\MatchingFlow;
use App\Modules\BMatching\Application\RequestProgress;
use App\Modules\BMatching\Jobs\PrepareMatching;
use App\Modules\CNotifications\Application\Inbox;
use App\Shared\Audit\AuditTrail;
use App\Shared\Rules\RuleBook;
use Illuminate\Support\Facades\DB;

/**
 * D-116 y D-120 (Fase A3): las dos intervenciones del administrador sobre una solicitud. No existe la asignación manual.
 * - Cancelar con motivo: en sent, pending_availability y assigned (RequestCancellation::cancelByAdmin).
 * - Reenviar al emparejamiento: en sent sin técnico asignado y en pending_availability. Cierra las rondas, retira las
 *   ofertas abiertas, sube la generación, toma las reglas vigentes y prepara una ronda nueva. El pendiente conserva su
 *   plazo de 24 h (D-21).
 * Cada intervención queda en la línea de tiempo, en la auditoría (con el motivo) y en un aviso al cliente. Corren dentro
 * de la transacción de Idempotency y devuelven [estado HTTP, cuerpo].
 */
final class RequestIntervention
{
    public const PERMISSION = 'requests.intervene';

    public function __construct(
        private readonly RequestCancellation $cancellation,
        private readonly MatchingFlow $flow,
        private readonly RequestProgress $progress,
        private readonly Inbox $inbox,
        private readonly AuditTrail $audit,
        private readonly RuleBook $rules,
    ) {}

    /** Acciones que permite el estado (D-120); sin el permiso, ninguna. */
    public static function actions(object $request, bool $assigned, bool $allowed): array
    {
        return [
            'cancel' => $allowed && in_array($request->status, RequestCancellation::ADMIN_CANCELLABLE, true),
            'rematch' => $allowed && self::canRematch($request, $assigned),
        ];
    }

    /**
     * Revisión del #70: por qué una acción no aplica según D-120 (para el title del botón desactivado). Null si aplica;
     * null también para todo sin el permiso, porque entonces el panel no muestra los botones.
     *
     * @return array{cancel: ?string, rematch: ?string}|null
     */
    public static function reasons(object $request, bool $assigned, bool $allowed): ?array
    {
        if (! $allowed) {
            return null;
        }
        $state = match ($request->status) {
            'registered' => __('api.intervention_blocked.registered'),
            'in_progress' => __('api.intervention_blocked.in_progress'),
            'completed', 'closed', 'unrated' => __('api.intervention_blocked.finished'),
            'cancelled' => __('api.intervention_blocked.cancelled'),
            'expired' => __('api.intervention_blocked.expired'),
            default => null,
        };

        return [
            'cancel' => in_array($request->status, RequestCancellation::ADMIN_CANCELLABLE, true) ? null : $state,
            'rematch' => self::canRematch($request, $assigned) ? null : ($state ?? __('api.intervention_blocked.assigned')),
        ];
    }

    public static function canRematch(object $request, bool $assigned): bool
    {
        return $request->status === 'pending_availability' || ($request->status === 'sent' && ! $assigned);
    }

    /** @return array{0:int,1:array} */
    public function cancel(User $admin, int $requestId, array $data): array
    {
        [$status, $body] = $this->cancellation->cancelByAdmin($admin, $requestId, $data);
        if ($status === 200) {
            $this->audit->record($admin, 'request.admin_cancelled', self::PERMISSION, 'service_request', $requestId, $data['reason']);
        }

        return [$status, $body];
    }

    /** @return array{0:int,1:array} */
    public function rematch(User $admin, int $requestId, array $data): array
    {
        $request = DB::table('service_requests')->where('id', $requestId)->lockForUpdate()->first();
        abort_unless($request, 404);
        if ((int) $request->version !== (int) $data['expected_version']) {
            return [409, ['error' => ['code' => 'STALE_VERSION', 'message' => __('api.stale_version')]]];
        }
        $assigned = DB::table('participations')->where('request_id', $requestId)->whereIn('status', ['assigned', 'in_progress'])->exists();
        if (! self::canRematch($request, $assigned)) {
            return [409, ['error' => ['code' => 'INTERVENTION_NOT_ALLOWED', 'message' => __('api.intervention_not_allowed')]]];
        }
        foreach (DB::table('offer_rounds')->where('request_id', $requestId)->whereIn('status', ['open', 'awaiting_choice'])->lockForUpdate()->get() as $round) {
            $this->flow->changeRound($round, 'closed');
        }
        $technicians = [];
        foreach (DB::table('offers')->where('request_id', $requestId)->whereIn('status', ['pending', 'accepted'])->orderBy('id')->lockForUpdate()->get() as $offer) {
            $this->flow->changeOffer($request, $offer, 'withdrawn', 'offer.withdrawn', 'Oferta retirada: un administrador reenvió la solicitud al emparejamiento.', $admin->id);
            $technicians[] = (int) $offer->technician_id;
        }
        $generation = (int) $request->search_generation + 1;
        $updated = $this->progress->advance($request, [
            'status' => 'sent', 'search_generation' => $generation, 'rule_version_id' => $this->rules->currentVersionId(),
        ], 'request.admin_rematched', 'Un administrador reenvió la solicitud al emparejamiento.', ['reason' => $data['reason']], $admin->id);
        PrepareMatching::dispatch($requestId, $generation)->afterCommit();

        foreach (DB::table('technician_profiles')->whereIn('id', array_unique($technicians))->pluck('user_id') as $technicianUser) {
            $this->inbox->notify((int) $technicianUser, 'offer.withdrawn', 'Una oferta ya no está disponible',
                "La solicitud #{$requestId} volvió a la búsqueda de técnicos.", 'service_request', $requestId);
        }
        $client = (int) DB::table('client_profiles')->where('id', $request->client_id)->value('user_id');
        $this->inbox->notify($client, 'request.admin_rematched', 'Volvimos a buscar técnicos',
            "El equipo de TécnicoYa volvió a buscar técnicos para tu solicitud #{$requestId}.", 'service_request', $requestId);
        $this->audit->record($admin, 'request.admin_rematched', self::PERMISSION, 'service_request', $requestId, $data['reason'],
            ['status' => $request->status, 'search_generation' => (int) $request->search_generation],
            ['status' => 'sent', 'search_generation' => $generation]);

        return [200, ['id' => (int) $updated->id, 'status' => $updated->status, 'version' => (int) $updated->version]];
    }
}
