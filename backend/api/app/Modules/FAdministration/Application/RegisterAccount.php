<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RegisterAccount
{
    public function execute(array $data): User
    {
        try {
            return DB::transaction(function () use ($data) {
                $role = DB::table('roles')->where('code', $data['account_type'])->where('active', 1)->first();
                abort_unless($role, 503, __('api.authorization_unavailable'));

                // D-75: con nombres y apellidos, name es el nombre para mostrar; el S1 aún puede enviar solo name.
                $name = isset($data['given_names']) ? trim($data['given_names'].' '.$data['family_names']) : $data['name'];
                $user = new User;
                $user->forceFill([
                    'name' => $name, 'given_names' => $data['given_names'] ?? null, 'family_names' => $data['family_names'] ?? null,
                    'email' => $data['email'], 'password' => $data['password'], 'phone' => $data['phone'] ?? null,
                    'terms_accepted_at' => isset($data['terms_accepted']) ? now() : null,
                    'role_id' => $role->id, 'is_active' => true,
                ])->save();

                if ($data['account_type'] === 'client') {
                    DB::table('client_profiles')->insert([
                        'user_id' => $user->id, 'client_type' => $data['client_type'], 'district_id' => $data['district_id'] ?? null,
                        'business_name' => $data['business_name'] ?? null, 'default_address' => $data['reference_address'] ?? null,
                    ]);
                } else {
                    $this->technicianProfile($user, $name, $data);
                }

                return $user->refresh();
            });
        } catch (UniqueConstraintViolationException $error) {
            // Una carrera por el mismo correo también devuelve validación, no una traza SQL.
            if (User::query()->where('email', $data['email'])->exists()) {
                throw ValidationException::withMessages(['email' => __('validation.unique', ['attribute' => 'correo'])]);
            }
            throw $error;
        }
    }

    /** D-80: distrito base, distritos atendidos (siempre con el base) y especialidades declaradas, sin servicios ni tarifas. */
    private function technicianProfile(User $user, string $name, array $data): void
    {
        $technicianId = DB::table('technician_profiles')->insertGetId([
            'user_id' => $user->id, 'display_name' => $name,
            'status' => 'pending_verification', 'verification_status' => 'pending', 'available_now' => false,
            'base_district_id' => $data['base_district_id'], 'experience_years' => $data['experience_years'],
            'whatsapp' => $data['whatsapp'] ?? null,
        ]);
        $districts = collect($data['district_ids'] ?? [])->push($data['base_district_id'])->map(fn ($id) => (int) $id)->unique();
        DB::table('technician_districts')->insert($districts->map(fn (int $id) => [
            'technician_id' => $technicianId, 'district_id' => $id, 'active' => 1,
        ])->values()->all());
        DB::table('technician_specialties')->insert(collect($data['specialty_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()
            ->map(fn (int $id) => ['technician_id' => $technicianId, 'specialty_id' => $id])->values()->all());
    }
}
