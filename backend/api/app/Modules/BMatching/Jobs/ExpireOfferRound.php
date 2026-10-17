<?php

namespace App\Modules\BMatching\Jobs;

use App\Modules\BMatching\Application\MatchingFlow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/** Contrato S4 §3: lleva la generación de búsqueda; con una generación anterior termina sin efectos. */
final class ExpireOfferRound implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $roundId, public readonly int $generation) {}

    public function handle(MatchingFlow $flow): void
    {
        $flow->expireRound($this->roundId, $this->generation);
    }
}
