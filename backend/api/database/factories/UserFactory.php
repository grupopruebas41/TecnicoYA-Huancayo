<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Usuarios sintéticos para pruebas. Usar UserFactory::new() porque User no declara HasFactory.
 * Los estados de rol leen roles.code, que carga AuthorizationSeeder (Sprint 1).
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => 'Usuario de prueba',
            'email' => Str::uuid().'@example.test',
            'password' => Str::password(32),
        ];
    }

    public function client(): static
    {
        return $this->withRole('client');
    }

    public function technician(): static
    {
        return $this->withRole('technician');
    }

    private function withRole(string $code): static
    {
        return $this->state(fn () => [
            'role_id' => DB::table('roles')->where('code', $code)->value('id'),
        ]);
    }
}
