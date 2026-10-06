<?php

namespace Database\Factories;

use App\Models\ServiceRequest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

/**
 * Solicitud registrada sintética de atención inmediata (requiere CatalogSeeder).
 *
 * @extends Factory<ServiceRequest>
 */
class ServiceRequestFactory extends Factory
{
    protected $model = ServiceRequest::class;

    public function definition(): array
    {
        return [
            'client_id' => fn () => ClientProfileFactory::new()->create()->id,
            'subcategory_id' => fn () => DB::table('subcategories')->where('code', 'computo-hardware')->value('id'),
            'district_id' => fn () => DistrictFactory::new()->create()->id,
            'description' => 'Descripción privada sintética de la falla.',
            'address' => 'Dirección privada sintética 123',
            'mode' => 'asap',
            'source' => 'automatic',
            'status' => 'registered',
            'version' => 1,
        ];
    }
}
