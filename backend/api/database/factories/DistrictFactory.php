<?php

namespace Database\Factories;

use App\Models\District;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Distrito sintético de prueba. La cobertura real sigue pendiente de P03.
 *
 * @extends Factory<District>
 */
class DistrictFactory extends Factory
{
    protected $model = District::class;

    public function definition(): array
    {
        $suffix = strtoupper(Str::random(6));

        return ['code' => 'T'.$suffix, 'name' => 'Distrito de prueba '.$suffix, 'active' => 1];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['active' => 0]);
    }
}
