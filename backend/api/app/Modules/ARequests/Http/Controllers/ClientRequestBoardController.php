<?php

namespace App\Modules\ARequests\Http\Controllers;

use App\Modules\ARequests\Application\ClientRequestBoard;
use App\Modules\ARequests\Application\RequestCancellation;
use App\Modules\BMatching\Http\Controllers\OfferController;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Mis solicitudes (contrato S5 §10): tablero y cancelación del titular con Idempotency-Key obligatoria. */
final class ClientRequestBoardController
{
    public function index(Request $request, ClientRequestBoard $board): JsonResponse
    {
        return ApiResponse::data($board->forClient($request->user(), $request->validate([
            'tab' => ['sometimes', Rule::in(ClientRequestBoard::TABS)],
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:30'],
        ], [
            'tab.in' => __('api.board_tab'), 'q.max' => __('api.board_search'),
        ])));
    }

    public function cancel(Request $request, int $serviceRequest, RequestCancellation $cancellation, Idempotency $idempotency): JsonResponse
    {
        $data = $request->validate([
            'reason_code' => ['required', Rule::in(RequestCancellation::REASON_CODES)],
            'reason' => ['nullable', 'string', 'max:255', 'required_if:reason_code,other', $request->input('reason_code') === 'other' ? 'min:5' : 'min:0'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ], [
            'reason_code.required' => __('api.cancellation_code'), 'reason_code.in' => __('api.cancellation_code'),
            'reason.required_if' => __('api.cancellation_reason'), 'reason.string' => __('api.cancellation_reason'),
            'reason.min' => __('api.cancellation_reason'), 'reason.max' => __('api.cancellation_comment'),
        ]);

        $key = (string) $request->header('Idempotency-Key');
        if ($key === '' || strlen($key) > 255) {
            throw ValidationException::withMessages(['idempotency_key' => __('api.idempotency_key_required')]);
        }

        return OfferController::render($idempotency->run($request->user(), "request.cancel:$serviceRequest",
            $key, $data, fn () => $cancellation->cancel($request->user(), $serviceRequest, $data)));
    }
}
