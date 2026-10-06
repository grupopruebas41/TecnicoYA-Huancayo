<?php

namespace Database\Factories;

use App\Models\ClientProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Perfil de cliente sintético con su usuario de rol cliente (requiere AuthorizationSeeder).
 *
 * @extends Factory<ClientProfile>
 */
class ClientProfileFactory extends Factory
{
    protected $model = ClientProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => UserFactory::new()->client()->create()->id,
            'client_type' => 'household',
            'version' => 1,
        ];
    }
}
