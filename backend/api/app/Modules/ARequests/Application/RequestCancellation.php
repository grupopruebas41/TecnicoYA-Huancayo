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

        $technicians = $this->releaseAssignment($request);
        foreach (DB::table('offer_rounds')->where('request_id', $request->id)->whereIn('status', ['open', 'awaiting_choice'])->lockForUpdate()->get() as $round) {
            $this->flow->changeRound($round, 'closed');
        }
        $offers = DB::table('offers')->where('request_id', $request->id)->whereIn('status', ['pending', 'accepted'])
            ->whereNotIn('id', DB::table('participations')->where('request_id', $request->id)->whereNotNull('offer_id')->pluck('offer_id'))
            ->orderBy('id')->lockForUpdate()->get();
        foreach ($offers as $offer) {
            $this->flow->changeOffer($request, $offer, 'withdrawn', 'offer.withdrawn', 'Oferta retirada: el cliente canceló la solicitud.', $user->id);
            $technicians[] = (int) $offer->technician_id;
        }
        $updated = $this->progress->advance($request, [
            'status' => 'cancelled', 'cancelled_at' => now(), 'cancellation_reason_code' => $data['reason_code'],
            'cancellation_reason' => ($data['reason'] ?? null) === null || trim($data['reason']) === '' ? null : $data['reason'],
            'search_generation' => (int) $request->search_generation + 1,
        ], 'request.cancelled', 'El cliente canceló la solicitud.', [], $user->id);

        foreach (DB::table('technician_profiles')->whereIn('id', array_unique($technicians))->pluck('user_id') as $technicianUser) {
            $this->inbox->notify((int) $technicianUser, 'request.cancelled', 'El cliente canceló una solicitud',
                "La solicitud #{$request->id} ya no necesita atención.", 'service_request', (int) $request->id);
        }

        return [200, ['id' => (int) $updated->id, 'status' => $updated->status, 'phase' => $updated->status, 'version' => (int) $updated->version]];
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
