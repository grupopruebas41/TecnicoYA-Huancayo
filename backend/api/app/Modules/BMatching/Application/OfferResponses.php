<?php

namespace App\Modules\BMatching\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Respuesta del técnico a su oferta (contrato S4 §4.3, RN-10.1). El plazo se comprueba con la hora del servidor y
 * bajo bloqueo aunque el job de vencimiento no haya corrido: a los 10:00 exactos ya venció (D-21). Aceptar revalida
 * la elegibilidad y no asigna (RN-10.3). Corre dentro de la transacción de Idempotency; los 409 se devuelven como
 * resultado para que queden guardados con la clave.
 */
final class OfferResponses
{
    public function __construct(
        private readonly MatchingFlow $flow,
        private readonly Eligibility $eligibility,
        private readonly OwnTechnician $technicians,
    ) {}

    /** @return array{0:int,1:array} */
    public function respond(User $user, int $offerId, array $data): array
    {
        $technicianId = $this->technicians->idFor($user);
        $requestId = DB::table('offers')->where('id', $offerId)->where('technician_id', $technicianId)->value('request_id');
        abort_unless($requestId, 404);
        $request = DB::table('service_requests')->where('id', $requestId)->lockForUpdate()->first();
        $offer = DB::table('offers')->where('id', $offerId)->first();
        $round = DB::table('offer_rounds')->where('id', $offer->round_id)->lockForUpdate()->first();
        $offer = DB::table('offers')->where('id', $offerId)->lockForUpdate()->first();

        $error = match (true) {
            (int) $offer->version !== (int) $data['expected_version'] => ['STALE_VERSION', __('api.stale_version')],
            $offer->status !== 'pending' => ['OFFER_NOT_PENDING', __('api.offer_not_pending')],
            now()->gte($offer->expires_at) => ['OFFER_EXPIRED', __('api.offer_expired')],
            $data['decision'] === 'accept' && $this->eligibility->codeFor($request, $technicianId) !== null
                => ['TECHNICIAN_UNAVAILABLE', __('api.technician_unavailable_self')],
            default => null,
        };
        if ($error) {
            return [409, ['error' => ['code' => $error[0], 'message' => $error[1]]]];
        }

        $accepted = $data['decision'] === 'accept';
        $this->flow->changeOffer($request, $offer, $accepted ? 'accepted' : 'rejected', $accepted ? 'offer.accepted' : 'offer.rejected',
            $accepted ? 'El técnico aceptó la oferta.' : 'El técnico rechazó la oferta.', $user->id,
            ['responded_at' => now(), 'response_reason' => $accepted ? null : ($data['reason'] ?? null)]);
        $this->flow->settle($request, $round);
        $offer = DB::table('offers')->find($offerId);

        return [200, [
            'id' => $offer->id, 'status' => $offer->status, 'version' => (int) $offer->version,
            'responded_at' => OfferView::iso($offer->responded_at),
            'round' => ['id' => $round->id, 'status' => DB::table('offer_rounds')->where('id', $round->id)->value('status')],
        ]];
    }
}
