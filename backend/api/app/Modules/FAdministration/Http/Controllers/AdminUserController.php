<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\ManageUsers;
use App\Modules\FAdministration\Http\Requests\AdminCreateUserRequest;
use App\Modules\FAdministration\Http\Requests\AdminUpdateUserRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Usuarios del panel (contrato S07 §9.1; permiso users.manage, D-85). Toda acción exige motivo. */
final class AdminUserController
{
    public function __construct(private readonly ManageUsers $users) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', Rule::in(ManageUsers::ROLES)],
            'status' => ['nullable', Rule::in(ManageUsers::STATUSES)],
            'district_id' => ['nullable', 'integer', 'min:1'],
            'created_from' => ['nullable', 'date_format:Y-m-d'],
            'created_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:created_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return ApiResponse::data($this->users->list($filters));
    }

    public function show(int $user): JsonResponse
    {
        return ApiResponse::data($this->users->detail($user));
    }

    public function store(AdminCreateUserRequest $request): JsonResponse
    {
        return ApiResponse::data($this->users->create($request->user(), $request->safe()->except('current_password')), 201);
    }

    public function update(AdminUpdateUserRequest $request, int $user): JsonResponse
    {
        return ApiResponse::data($this->users->update($request->user(), $user, $request->validated()));
    }

    public function block(Request $request, int $user): JsonResponse
    {
        return ApiResponse::data($this->users->block($request->user(), $user, $this->motive($request)));
    }

    public function unblock(Request $request, int $user): JsonResponse
    {
        return ApiResponse::data($this->users->unblock($request->user(), $user, $this->motive($request)));
    }

    public function resetAccess(Request $request, int $user): JsonResponse
    {
        return ApiResponse::data($this->users->resetAccess($request->user(), $user, $this->motive($request)));
    }

    public function closeSessions(Request $request, int $user): JsonResponse
    {
        return ApiResponse::data($this->users->closeSessions($request->user(), $user, $this->motive($request)));
    }

    public function activationLink(Request $request, int $user): JsonResponse
    {
        $reason = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:500']])['reason'];

        return ApiResponse::data($this->users->resendActivation($request->user(), $user, $reason));
    }

    /** Eliminar = anonimizar; se confirma escribiendo ELIMINAR (también lo exige la SPA). */
    public function destroy(Request $request, int $user): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'], 'expected_version' => ['required', 'integer', 'min:1'],
            'confirmation' => ['required', 'string', 'in:ELIMINAR'],
        ], ['confirmation.in' => __('api.user_delete_confirmation'), 'confirmation.required' => __('api.user_delete_confirmation')]);

        return ApiResponse::data($this->users->anonymize($request->user(), $user, $data));
    }

    private function motive(Request $request): array
    {
        return $request->validate(['reason' => ['required', 'string', 'min:5', 'max:500'], 'expected_version' => ['required', 'integer', 'min:1']]);
    }
}
