<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Especialidades del catálogo: alta con foto (hero_media_id) y edición versionada. Desactivar no toca
 * subcategorías ni servicios; el catálogo público y el carrusel ya filtran por especialidad activa.
 */
final class ManageSpecialties
{
    private const EDITABLE = ['name' => 'name', 'description' => 'description', 'image_id' => 'hero_media_id', 'active' => 'active'];

    public function __construct(private readonly CatalogEntries $entries) {}

    public function create(User $actor, array $data): object
    {
        return $this->entries->create($actor, 'specialties', 'specialty', fn () => [
            'code' => CatalogCode::unique('specialties', Str::limit(Str::slug($data['name']), 36, '')),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'hero_media_id' => $data['image_id'] ?? null,
            'display_order' => (int) DB::table('specialties')->max('display_order') + 1,
        ], 'Alta de especialidad desde el panel administrativo.');
    }

    public function update(User $actor, int $id, array $data): object
    {
        return $this->entries->update($actor, 'specialties', 'specialty', $id, $data, self::EDITABLE,
            'Edición de especialidad desde el panel administrativo.');
    }
}
