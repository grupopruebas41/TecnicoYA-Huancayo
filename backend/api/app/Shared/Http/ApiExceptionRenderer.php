<?php

namespace App\Shared\Http;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

final class ApiExceptionRenderer
{
    public function __invoke(Throwable $error, Request $request): ?JsonResponse
    {
        if (! $request->is('api/v1/*')) {
            return null; // Conservar el contrato de las rutas históricas.
        }
        if ($error instanceof ValidationException) {
            return ApiResponse::error('VALIDATION_FAILED', __('api.validation_failed'), 422, $error->errors());
        }
        if ($error instanceof AuthenticationException) {
            return ApiResponse::error('UNAUTHENTICATED', __('api.unauthenticated'), 401);
        }
        if ($error instanceof HttpExceptionInterface) {
            $status = $error->getStatusCode();
            [$code, $key] = match ($status) {
                403 => ['FORBIDDEN', 'forbidden'],
                404 => ['NOT_FOUND', 'not_found'],
                409 => ['STALE_VERSION', 'stale_version'],
                419 => ['SESSION_EXPIRED', 'session_expired'],
                429 => ['TOO_MANY_REQUESTS', 'too_many_requests'],
                503 => ['SERVICE_UNAVAILABLE', 'service_unavailable'],
                default => ['REQUEST_FAILED', 'request_failed'],
            };

            return ApiResponse::error($code, __('api.'.$key), $status)->withHeaders($error->getHeaders());
        }

        return ApiResponse::error('INTERNAL_ERROR', __('api.internal_error'), 500);
    }
}
