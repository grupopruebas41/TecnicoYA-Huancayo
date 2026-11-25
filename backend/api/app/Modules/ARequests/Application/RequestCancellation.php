<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use App\Modules\BMatching\Application\MatchingFlow;
use App\Modules\BMatching\Application\RequestProgress;
use App\Modules\CNotifications\Application\Inbox;
use Illuminate\Support\Facades\DB;

/**
 * Cancelación del cliente antes de iniciar la atención (HU-S05-06, D-28, D-100). Retira las ofertas abiertas, cierra la
 * ronda y libera la participación y la cita; sube la generación para que los trabajos pendientes no tengan efecto. El
 * historial se conserva y el motivo no se muestra al técnico. Corre dentro de la transacción de Idempotency.
 */
final class RequestCancellation
{
    /** Estados en los que el cliente puede cancelar; desde in_progress no se cancela (D-28: se registra una incidencia). */
    public const CANCELLABLE = ['registered', 'sent', 'pending_availability', 'assigned'];

    /** D-120: estados en los que el administrador puede cancelar (no el borrador, que es del cliente). */
    public const ADMIN_CANCELLABLE = ['sent', 'pending_availability', 'assigned'];

    /** D-100: motivos de la lista cerrada; con «other» el comentario es obligatorio. */
    public const REASON_CODES = ['solved', 'other_technician', 'reschedule', 'price', 'mistake', 'other'];

    public function __construct(
        private readonly MatchingFlow $flow,
        private readonly RequestProgress $progress,
        private readonly Inbox $inbox,
    ) {}

    /** @return array{0:int,1:array} */
    public function cancel(User $user, int $requestId, array $data): array
    {
        $request = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->where('r.id', $requestId)->where('c.user_id', $user->id)->lockForUpdate()->first(['r.*']);
        abort_unless($request, 404);
        if ((int) $request->version !== (int) $data['expected_version']) {
            return [409, ['error' => ['code' => 'STALE_VERSION', 'message' => __('api.stale_version')]]];
        }
        if (! in_array($request->status, self::CANCELLABLE, true)) {
            return [409, ['error' => ['code' => 'CANCELLATION_NOT_ALLOWED', 'message' => __('api.cancellation_not_allowed')]]];
        }

        $updated = $this->close($request, $user->id, [
            'cancellation_reason_code' => $data['reason_code'],
            'cancellation_reason' => ($data['reason'] ?? null) === null || trim($data['reason']) === '' ? null : $data['reason'],
        ], 'request.cancelled', 'El cliente canceló la solicitud.', 'Oferta retirada: el cliente canceló la solicitud.',
            ['El cliente canceló una solicitud', "La solicitud #{$request->id} ya no necesita atención."]);

        return [200, ['id' => (int) $updated->id, 'status' => $updated->status, 'phase' => $updated->status, 'version' => (int) $updated->version]];
    }

    /**
     * D-116 y D-120: cancelación del administrador con motivo obligatorio. Libera la asignación y las ofertas igual que la
     * del cliente; el técnico recibe el aviso sin el motivo y el cliente, un aviso propio. Devuelve [estado HTTP, cuerpo]
     * para Idempotency; la auditoría la registra quien llama.
     *
     * @return array{0:int,1:array}
     */
    public function cancelByAdmin(User $admin, int $requestId, array $data): array
    {
        $request = DB::table('service_requests')->where('id', $requestId)->lockForUpdate()->first();
        abort_unless($request, 404);
        if ((int) $request->version !== (int) $data['expected_version']) {
            return [409, ['error' => ['code' => 'STALE_VERSION', 'message' => __('api.stale_version')]]];
        }
        if (! in_array($request->status, self::ADMIN_CANCELLABLE, true)) {
            return [409, ['error' => ['code' => 'INTERVENTION_NOT_ALLOWED', 'message' => __('api.intervention_not_allowed')]]];
        }
        $updated = $this->close($request, $admin->id, ['cancellation_reason_code' => 'admin_intervention', 'cancellation_reason' => $data['reason']],
            'request.admin_cancelled', 'Un administrador canceló la solicitud.', 'Oferta retirada: un administrador canceló la solicitud.',
            ['Se canceló una solicitud', "La solicitud #{$request->id} ya no necesita atención."]);
        $client = (int) DB::table('client_profiles')->where('id', $request->client_id)->value('user_id');
        $this->inbox->notify($client, 'request.admin_cancelled', 'Cancelamos tu solicitud',
            "El equipo de TécnicoYa canceló la solicitud #{$request->id}. Si aún necesitas ayuda, crea una nueva.", 'service_request', (int) $request->id);

        return [200, ['id' => (int) $updated->id, 'status' => $updated->status, 'version' => (int) $updated->version]];
    }

    /**
     * Cierre común: libera la asignación, cierra las rondas, retira las ofertas abiertas, deja la solicitud cancelada
     * (con la generación nueva para que los trabajos pendientes no tengan efecto) y avisa a los técnicos, sin el motivo.
     */
    private function close(object $request, int $actorId, array $fields, string $event, string $summary, string $offerSummary, array $notice): object
    {
        $technicians = $this->releaseAssignment($request);
        foreach (DB::table('offer_rounds')->where('request_id', $request->id)->whereIn('status', ['open', 'awaiting_choice'])->lockForUpdate()->get() as $round) {
            $this->flow->changeRound($round, 'closed');
        }
        $offers = DB::table('offers')->where('request_id', $request->id)->whereIn('status', ['pending', 'accepted'])
            ->whereNotIn('id', DB::table('participations')->where('request_id', $request->id)->whereNotNull('offer_id')->pluck('offer_id'))
            ->orderBy('id')->lockForUpdate()->get();
        foreach ($offers as $offer) {
            $this->flow->changeOffer($request, $offer, 'withdrawn', 'offer.withdrawn', $offerSummary, $actorId);
            $technicians[] = (int) $offer->technician_id;
        }
        $updated = $this->progress->advance($request, $fields + [
            'status' => 'cancelled', 'cancelled_at' => now(), 'search_generation' => (int) $request->search_generation + 1,
        ], $event, $summary, [], $actorId);

        foreach (DB::table('technician_profiles')->whereIn('id', array_unique($technicians))->pluck('user_id') as $technicianUser) {
            $this->inbox->notify((int) $technicianUser, 'request.cancelled', $notice[0], $notice[1], 'service_request', (int) $request->id);
        }

        return $updated;
    }

    /** @return int[] técnicos que tenían la solicitud asignada */
    private function releaseAssignment(object $request): array
    {
        $participations = DB::table('participations')->where('request_id', $request->id)->where('status', 'assigned')->lockForUpdate()->get();
        foreach ($participations as $participation) {
            DB::table('participations')->where('id', $participation->id)->update(['status' => 'cancelled', 'version' => (int) $participation->version + 1, 'updated_at' => now()]);
            DB::table('appointments')->where('participation_id', $participation->id)->where('status', 'confirmed')
                ->update(['status' => 'cancelled', 'version' => DB::raw('version + 1'), 'updated_at' => now()]);
        }

        return $participations->map(fn (object $participation) => (int) $participation->technician_id)->all();
    }
}
