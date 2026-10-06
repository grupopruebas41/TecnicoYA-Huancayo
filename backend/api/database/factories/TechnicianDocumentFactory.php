<?php

namespace Database\Factories;

use App\Models\TechnicianDocument;
use App\Models\TechnicianProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Documento de verificación sintético, privado, del propio técnico.
 *
 * @extends Factory<TechnicianDocument>
 */
class TechnicianDocumentFactory extends Factory
{
    protected $model = TechnicianDocument::class;

    public function definition(): array
    {
        return [
            'technician_id' => fn () => TechnicianProfileFactory::new()->create()->id,
            'media_id' => fn (array $attributes) => MediaFileFactory::new()->privateDocument()->create([
                'owner_id' => TechnicianProfile::query()->findOrFail($attributes['technician_id'])->user_id,
            ])->id,
            'document_type' => 'identity',
        ];
    }
}
