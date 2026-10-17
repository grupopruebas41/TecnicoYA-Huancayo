<?php

namespace App\Modules\BMatching\Application;

use Illuminate\Support\Facades\DB;

/**
 * Fase de la búsqueda que ve la pantalla (contrato S4 §1). Una solicitud dirigida desde un perfil busca solo al
 * técnico objetivo mientras siga en la generación 1; la búsqueda alternativa abre la generación 2 (RN-12).
 */
final class SearchState
{
    public static function isDirect(object $request): bool
    {
        return $request->source === 'profile' && (int) $request->search_generation <= 1;
    }

    public function phase(object $request): string
    {
        if ($request->status !== 'sent') {
            return $request->status;
        }
        $round = $this->currentRound($request);
        if ($round?->status === 'open') {
            return 'awaiting_responses';
        }
        if ($round?->status === 'awaiting_choice') {
            return 'awaiting_choice';
        }
        $searched = DB::table('matching_runs')->where('request_id', $request->id)
            ->where('search_generation', $request->search_generation)->where('status', 'completed')->exists();

        return self::isDirect($request) && $searched ? 'direct_declined' : 'matching';
    }

    /** Ronda más reciente de la generación vigente. */
    public function currentRound(object $request): ?object
    {
        return DB::table('offer_rounds')->where('request_id', $request->id)
            ->where('search_generation', $request->search_generation)->orderByDesc('round_no')->first();
    }
}
