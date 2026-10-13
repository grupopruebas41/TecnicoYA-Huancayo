<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Especialidades del catálogo: alta con foto (hero_media_id) y edición versionada. Desactivar no toca
 * subcategorías ni servicios; el catálogo público y el carrusel ya filtran por especialidad activa.
 */
final class ManageSpecialties
{
    private const EDITABLE = ['name' => 'name', 'description' => 'description', 'image_id' => 'hero_media_id', 'active' => 'active'];

    public function __construct(private readonly AuditTrail $audit, private readonly VersionedUpdate $updates) {}

    public function create(User $actor, array $data): object
    {
        return DB::transaction(function () use ($actor, $data) {
            $id = DB::table('specialties')->insertGetId([
                'code' => CatalogCode::unique('specialties', Str::limit(Str::slug($data['name']), 36, '')),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'hero_media_id' => $data['image_id'] ?? null,
                'display_order' => (int) DB::table('specialties')->max('display_order') + 1,
            ]);
            $this->audit->record($actor, 'catalog.specialty.created', 'catalog.manage', 'specialty', $id,
                'Alta de especialidad desde el panel administrativo.', [], ['name' => $data['name']]);

            return DB::table('specialties')->find($id);
        });
    }

    public function update(User $actor, int $id, array $data): object
    {
        return DB::transaction(fn () => $this->updates->apply($actor, 'specialties', $id, (int) $data['expected_version'],
            CatalogCode::changes($data, self::EDITABLE), [
                'action' => 'catalog.specialty.updated', 'permission' => 'catalog.manage', 'subject' => 'specialty',
                'reason' => 'Edición de especialidad desde el panel administrativo.',
            ]));
    }
}
