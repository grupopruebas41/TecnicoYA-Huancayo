<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends AccountRequest
{
    public function rules(): array
    {
        return $this->privilegedFields() + [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100', 'prohibits:given_names,family_names'],
            // D-75: nombres y apellidos van juntos y componen el nombre para mostrar.
            'given_names' => ['required_with:family_names', 'string', 'min:2', 'max:50'],
            'family_names' => ['required_with:given_names', 'string', 'min:2', 'max:50'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^\+?[0-9 ()-]+$/'],
            // D-76: preferencia de tema del panel.
            'theme_preference' => ['sometimes', 'nullable', Rule::in(['light', 'dark', 'system'])],
            // D-77: foto de perfil propia, con finalidad avatar, revisada y no retirada; null la quita.
            'avatar_media_id' => ['sometimes', 'nullable', 'integer', function (string $attribute, mixed $value, Closure $fail) {
                $owned = DB::table('media_files')->where('id', $value)->where('owner_id', $this->user()->id)
                    ->where('purpose', 'avatar')->where('scan_status', 'clean')->whereNull('retired_at')->exists();
                if (! $owned) {
                    $fail(__('api.avatar_not_allowed'));
                }
            }],
            // D-91 (PERFIL-02): solo el cliente edita su distrito principal y su dirección de referencia privada.
            'district_id' => [$this->clientOnly(), 'sometimes', 'required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'reference_address' => [$this->clientOnly(), 'sometimes', 'nullable', 'string', 'max:255'],
            'expected_version' => ['required', 'integer', 'min:1'],
            'email' => ['prohibited'], 'password' => ['prohibited'], 'password_confirmation' => ['prohibited'],
            'account_type' => ['prohibited'], 'client_type' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return ['district_id.exists' => __('api.district_inactive')];
    }

    /** Rechaza el campo si la cuenta no tiene perfil de cliente (técnicos y administradores). */
    private function clientOnly(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            if (! DB::table('client_profiles')->where('user_id', $this->user()->id)->exists()) {
                $fail(__('api.client_fields_only'));
            }
        };
    }
}
