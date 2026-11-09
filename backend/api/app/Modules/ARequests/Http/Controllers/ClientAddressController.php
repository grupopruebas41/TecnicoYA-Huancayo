<?php

namespace App\Modules\ARequests\Http\Controllers;

use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Fase 4 del panel final: «Mis direcciones» del cliente titular (Casa, Negocio u otra), hasta 5. Solo el dueño las ve;
 * una ajena responde 404. La dirección predeterminada es única y el asistente la ofrece en el paso 4.
 */
final class ClientAddressController
{
    public const MAX = 5;

    public const KINDS = ['home' => 'Casa', 'business' => 'Negocio', 'other' => 'Otra'];

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::data(['items' => $this->list((int) $request->user()->id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $data = $this->validated($request);
        if (DB::table('client_addresses')->where('user_id', $userId)->count() >= self::MAX) {
            return ApiResponse::error('ADDRESS_LIMIT', __('api.address_limit'), 422, ['kind' => [__('api.address_limit')]]);
        }
        $id = DB::transaction(function () use ($userId, $data) {
            $first = ! DB::table('client_addresses')->where('user_id', $userId)->exists();
            $default = $first || ! empty($data['is_default']);
            if ($default) {
                DB::table('client_addresses')->where('user_id', $userId)->update(['is_default' => false]);
            }

            return DB::table('client_addresses')->insertGetId($this->row($data) + ['user_id' => $userId, 'is_default' => $default]);
        });

        return ApiResponse::data($this->present(DB::table('client_addresses')->find($id)), 201);
    }

    public function update(Request $request, int $address): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $data = $this->validated($request) + $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);
        $row = DB::transaction(function () use ($userId, $address, $data) {
            $current = DB::table('client_addresses')->where('id', $address)->where('user_id', $userId)->lockForUpdate()->first();
            abort_unless($current, 404);
            abort_unless((int) $current->version === (int) $data['expected_version'], 409, __('api.stale_version'));
            if (! empty($data['is_default'])) {
                DB::table('client_addresses')->where('user_id', $userId)->update(['is_default' => false]);
            }
            DB::table('client_addresses')->where('id', $address)->update($this->row($data) + [
                'is_default' => ! empty($data['is_default']) || (bool) $current->is_default, 'version' => $current->version + 1, 'updated_at' => now(),
            ]);

            return DB::table('client_addresses')->find($address);
        });

        return ApiResponse::data($this->present($row));
    }

    public function destroy(Request $request, int $address): Response
    {
        $userId = (int) $request->user()->id;
        DB::transaction(function () use ($userId, $address) {
            $current = DB::table('client_addresses')->where('id', $address)->where('user_id', $userId)->lockForUpdate()->first();
            abort_unless($current, 404);
            DB::table('client_addresses')->where('id', $address)->delete();
            // Si era la predeterminada, pasa a serlo la más antigua que quede.
            if ($current->is_default) {
                $next = DB::table('client_addresses')->where('user_id', $userId)->orderBy('id')->value('id');
                if ($next) {
                    DB::table('client_addresses')->where('id', $next)->update(['is_default' => true]);
                }
            }
        });

        return response()->noContent();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'kind' => ['required', Rule::in(array_keys(self::KINDS))],
            'label' => ['nullable', 'string', 'max:40', 'required_if:kind,other'],
            'district_id' => ['required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'address' => ['required', 'string', 'min:5', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
            'user_id' => ['prohibited'],
        ], [
            'kind.required' => __('api.address_kind'), 'kind.in' => __('api.address_kind'),
            'label.required_if' => __('api.address_label'), 'label.max' => __('api.address_label'),
            'district_id.required' => __('api.district_inactive'), 'district_id.exists' => __('api.district_inactive'),
            'address.required' => __('api.address_text'), 'address.min' => __('api.address_text'), 'address.max' => __('api.address_text'),
            'reference.max' => __('api.address_reference'),
        ]);
    }

    private function row(array $data): array
    {
        $label = $data['kind'] === 'other' ? trim((string) $data['label']) : (trim((string) ($data['label'] ?? '')) ?: self::KINDS[$data['kind']]);

        return ['kind' => $data['kind'], 'label' => $label, 'district_id' => $data['district_id'], 'address' => trim($data['address']),
            'reference' => isset($data['reference']) && trim($data['reference']) !== '' ? trim($data['reference']) : null];
    }

    private function list(int $userId): array
    {
        return DB::table('client_addresses')->where('user_id', $userId)->orderByDesc('is_default')->orderBy('id')->get()
            ->map(fn (object $row) => $this->present($row))->all();
    }

    private function present(object $row): array
    {
        return [
            'id' => (int) $row->id, 'kind' => $row->kind, 'label' => $row->label, 'district_id' => (int) $row->district_id,
            'district_name' => DB::table('districts')->where('id', $row->district_id)->value('name'),
            'address' => $row->address, 'reference' => $row->reference, 'is_default' => (bool) $row->is_default, 'version' => (int) $row->version,
        ];
    }
}
