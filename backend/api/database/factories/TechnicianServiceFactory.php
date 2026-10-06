<?php

namespace Database\Factories;

use App\Models\ServiceRateVersion;
use App\Models\TechnicianProfile;
use App\Models\TechnicianService;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

/**
 * Servicio ofrecido por un técnico, con su versión 1 de tarifa referencial (requiere CatalogSeeder).
 *
 * @extends Factory<TechnicianService>
 */
class TechnicianServiceFactory extends Factory
{
    protected $model = TechnicianService::class;

    public function definition(): array
    {
        return [
            'technician_id' => fn () => TechnicianProfileFactory::new()->create()->id,
            'subcategory_id' => fn () => DB::table('subcategories')->where('code', 'computo-hardware')->value('id'),
            'reference_fee' => '50.00',
            'currency' => 'PEN',
            'current_rate_version' => 1,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (TechnicianService $service) {
            ServiceRateVersion::query()->create([
                'technician_service_id' => $service->id,
                'version_no' => 1,
                'reference_fee' => $service->reference_fee,
                'currency' => $service->currency,
                'changed_by' => TechnicianProfile::query()->findOrFail($service->technician_id)->user_id,
                'effective_from' => now(),
            ]);
        });
    }
}
