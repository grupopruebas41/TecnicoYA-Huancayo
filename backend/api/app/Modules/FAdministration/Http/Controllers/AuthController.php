<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\RegisterAccount;
use App\Modules\FAdministration\Http\Requests\LoginRequest;
use App\Modules\FAdministration\Http\Requests\RegisterAccountRequest;
use App\Modules\FAdministration\Http\Resources\AccountData;
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

    public function login(LoginRequest $request): JsonResponse
    {
        abort_unless($request->hasSession(), 419, __('api.session_expired'));
        $credentials = $request->validated() + ['is_active' => true];
        if (! Auth::guard('web')->attempt($credentials)) {
            return ApiResponse::error('INVALID_CREDENTIALS', __('api.invalid_credentials'), 401);
        }
        $request->session()->regenerate();

        return ApiResponse::data(AccountData::from(Auth::guard('web')->user()));
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
