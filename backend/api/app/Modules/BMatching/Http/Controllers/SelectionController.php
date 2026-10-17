<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Application\CandidatesView;
use App\Modules\BMatching\Application\ClientSelection;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Elección del cliente titular (contrato S4 §5.1 a §5.3). */
final class SelectionController
{
    public function __construct(private readonly ClientSelection $selection) {}

    public function candidates(Request $request, int $serviceRequest, CandidatesView $view): JsonResponse
    {
        return ApiResponse::data($view->forClient($request->user(), $serviceRequest));
    }

    public function select(Request $request, int $serviceRequest, Idempotency $idempotency): JsonResponse
    {
        $data = $request->validate([
            'offer_id' => ['required', 'integer', 'min:1'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ]);

        return OfferController::render($idempotency->run($request->user(), "request.select:$serviceRequest",
            (string) $request->header('Idempotency-Key'), $data, fn () => $this->selection->select($request->user(), $serviceRequest, $data)));
    }

    public function alternatives(Request $request, int $serviceRequest, Idempotency $idempotency): JsonResponse
    {
        $data = $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);

        return OfferController::render($idempotency->run($request->user(), "request.alternatives:$serviceRequest",
            (string) $request->header('Idempotency-Key'), $data, fn () => $this->selection->searchAlternatives($request->user(), $serviceRequest, $data)));
    }
}
