<?php

namespace App\Modules\ARequests\Http\Controllers;

use App\Modules\ARequests\Application\ServiceOrders;
use App\Modules\ARequests\Http\Requests\StoreServiceOrderRequest;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Pedido con varios rubros (D-92): cupo del cliente y envío atómico con Idempotency-Key obligatoria. */
final class ServiceOrderController
{
    public function __construct(private readonly ServiceOrders $orders) {}

    public function quota(Request $request): JsonResponse
    {
        $clientId = DB::table('client_profiles')->where('user_id', $request->user()->id)->value('id');
        abort_unless($clientId, 403);

        return ApiResponse::data($this->orders->quotaFor((int) $clientId));
    }

    public function store(StoreServiceOrderRequest $request, Idempotency $idempotency): JsonResponse
    {
        [$status, $data] = $idempotency->run(
            $request->user(), 'order.create', (string) $request->header('Idempotency-Key'), $request->validated(),
            fn () => [201, $this->orders->place($request->user(), $request->validated())],
        );

        return ApiResponse::data($data, $status);
    }
}
