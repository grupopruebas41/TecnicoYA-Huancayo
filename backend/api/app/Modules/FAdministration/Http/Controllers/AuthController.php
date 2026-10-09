<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\AuditAdminAccess;
use App\Modules\FAdministration\Application\RegisterAccount;
use App\Modules\FAdministration\Http\Requests\LoginRequest;
use App\Modules\FAdministration\Http\Requests\RegisterAccountRequest;
use App\Modules\FAdministration\Http\Resources\AccountData;
use App\Shared\Auth\EffectivePermissions;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

final class AuthController
{
    public function register(RegisterAccountRequest $request, RegisterAccount $register): JsonResponse
    {
        abort_unless($request->hasSession(), 419, __('api.session_expired'));

        return ApiResponse::data(AccountData::from($register->execute($request->validated())), 201);
    }

    public function login(LoginRequest $request, AuditAdminAccess $audit): JsonResponse
    {
        abort_unless($request->hasSession(), 419, __('api.session_expired'));
        $credentials = $request->validated() + ['is_active' => true];
        if (! Auth::guard('web')->attempt($credentials)) {
            $audit->failed($credentials['email']);

            return ApiResponse::error('INVALID_CREDENTIALS', __('api.invalid_credentials'), 401);
        }
        if (! app(EffectivePermissions::class)->accountEnabled(Auth::guard('web')->user())) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $audit->failed($credentials['email']);

            return ApiResponse::error('INVALID_CREDENTIALS', __('api.invalid_credentials'), 401);
        }
        $request->session()->regenerate();
        $audit->succeeded(Auth::guard('web')->user());

        return ApiResponse::data(AccountData::from(Auth::guard('web')->user()));
    }

    public function logout(Request $request, AuditAdminAccess $audit): Response
    {
        $audit->loggedOut($request->user());
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
