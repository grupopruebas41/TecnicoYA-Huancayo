<?php

namespace Database\Factories;

use App\Models\TechnicianProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Perfil técnico sintético con su usuario de rol técnico (requiere AuthorizationSeeder).
 *
 * @extends Factory<TechnicianProfile>
 */
class TechnicianProfileFactory extends Factory
{
    protected $model = TechnicianProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => UserFactory::new()->technician()->create(['phone' => '900000010'])->id,
            'display_name' => 'Técnico de prueba',
            'status' => 'pending_verification',
            'verification_status' => 'pending',
            'experience_years' => 4,
            'version' => 1,
        ];
    }

    /** Técnico ya habilitado por una revisión anterior. */
    public function approved(): static
    {
        return $this->state(fn () => ['status' => 'active', 'verification_status' => 'approved', 'verified_at' => now()]);
    }
}
