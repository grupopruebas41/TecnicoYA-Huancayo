<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\ChangePassword;
use App\Modules\FAdministration\Application\UpdateProfile;
use App\Modules\FAdministration\Http\Requests\ChangePasswordRequest;
use App\Modules\FAdministration\Http\Requests\UpdateProfileRequest;
use App\Modules\FAdministration\Http\Resources\AccountData;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ProfileController
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::data(AccountData::from($request->user()->fresh()));
    }

    public function update(UpdateProfileRequest $request, UpdateProfile $update): JsonResponse
    {
        return ApiResponse::data(AccountData::from($update->execute($request->user(), $request->validated())));
    }

    public function password(ChangePasswordRequest $request, ChangePassword $change): JsonResponse
    {
        $change->execute($request->user(), $request->validated('password'), $request->hasSession() ? $request->session()->getId() : null);
        // Sanctum guarda al terminar el hash de la contraseña del usuario del guard: si conservara el viejo,
        // la sesión actual se cerraría en la siguiente petición.
        $request->user()->refresh();

        return ApiResponse::data(['message' => __('api.password_changed')]);
    }
}
