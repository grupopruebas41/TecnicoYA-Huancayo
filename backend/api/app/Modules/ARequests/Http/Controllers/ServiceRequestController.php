<?php

namespace App\Modules\ARequests\Http\Controllers;

use App\Modules\ARequests\Application\ManageServiceRequests;
use App\Modules\ARequests\Application\ServiceRequestView;
use App\Modules\ARequests\Http\Requests\AttachEvidenceRequest;
use App\Modules\ARequests\Http\Requests\StoreServiceRequestRequest;
use App\Modules\ARequests\Http\Requests\SubmitServiceRequestRequest;
use App\Modules\ARequests\Http\Requests\UpdateServiceRequestRequest;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ServiceRequestController
{
    public function __construct(private readonly ManageServiceRequests $requests, private readonly ServiceRequestView $view) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::data($this->view->listFor($request->user()));
    }

    public function show(Request $request, int $serviceRequest): JsonResponse
    {
        return ApiResponse::data($this->view->detailFor($request->user(), $serviceRequest));
    }

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        $id = $this->requests->register($request->user(), $request->validated());

        return ApiResponse::data($this->view->detailFor($request->user(), $id), 201);
    }

    public function update(UpdateServiceRequestRequest $request, int $serviceRequest): JsonResponse
    {
        $this->requests->correct($request->user(), $serviceRequest, $request->validated());

        return ApiResponse::data($this->view->detailFor($request->user(), $serviceRequest));
    }

    public function attach(AttachEvidenceRequest $request, int $serviceRequest): JsonResponse
    {
        $version = $this->requests->attach($request->user(), $serviceRequest, $request->validated());

        return ApiResponse::data(['request_id' => $serviceRequest, 'media_id' => (int) $request->validated('media_id'), 'version' => $version], 201);
    }

    public function detach(Request $request, int $serviceRequest, int $media): JsonResponse|\Illuminate\Http\Response
    {
        $data = $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);
        $this->requests->detach($request->user(), $serviceRequest, $media, (int) $data['expected_version']);

        return response()->noContent();
    }

    public function submit(SubmitServiceRequestRequest $request, int $serviceRequest, Idempotency $idempotency): JsonResponse
    {
        [$status, $data] = $idempotency->run(
            $request->user(), "request.submit:$serviceRequest", (string) $request->header('Idempotency-Key'),
            $request->validated(),
            fn () => [202, $this->requests->submit($request->user(), $serviceRequest, (int) $request->validated('expected_version'))],
        );

        return ApiResponse::data($data, $status);
    }
}
