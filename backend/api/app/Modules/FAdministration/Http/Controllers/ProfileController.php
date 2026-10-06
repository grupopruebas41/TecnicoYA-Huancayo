<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\UpdateProfile;
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
}
