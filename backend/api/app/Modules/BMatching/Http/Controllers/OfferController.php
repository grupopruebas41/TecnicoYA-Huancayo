<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Application\OfferResponses;
use App\Modules\BMatching\Application\OfferView;
use App\Modules\BMatching\Http\Requests\RespondOfferRequest;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Ofertas del técnico de la sesión (contrato S4 §4). */
final class OfferController
{
    public function __construct(private readonly OfferView $view) {}

    public function index(Request $request): JsonResponse
    {
        // status admite la lista separada por comas del contrato (?status=pending,accepted).
        if (is_string($request->query('status'))) {
            $request->merge(['status' => explode(',', $request->query('status'))]);
        }
        $filters = $request->validate([
            'status' => ['sometimes', 'array'],
            'status.*' => ['in:pending,accepted,rejected,expired,withdrawn'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        return ApiResponse::data($this->view->listFor($request->user(), $filters));
    }

    public function show(Request $request, int $offer): JsonResponse
    {
        return ApiResponse::data($this->view->detailFor($request->user(), $offer));
    }

    public function respond(RespondOfferRequest $request, int $offer, Idempotency $idempotency, OfferResponses $responses): JsonResponse
    {
        return self::render($idempotency->run($request->user(), "offer.respond:$offer", (string) $request->header('Idempotency-Key'),
            $request->validated(), fn () => $responses->respond($request->user(), $offer, $request->validated())));
    }

    /** Resultado de un comando idempotente: los 409 de negocio se guardan con la clave y salen con su código. */
    public static function render(array $result): JsonResponse
    {
        [$status, $data] = $result;

        return $status >= 400 ? ApiResponse::error($data['error']['code'], $data['error']['message'], $status) : ApiResponse::data($data, $status);
    }
}
