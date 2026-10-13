<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Distritos de cobertura (D-15): ampliables por el administrador; desactivar conserva las zonas ya asignadas. */
final class ManageDistricts
{
    private const EDITABLE = ['name' => 'name', 'active' => 'active'];

    public function __construct(private readonly AuditTrail $audit, private readonly VersionedUpdate $updates) {}

    public function create(User $actor, array $data): object
    {
        return DB::transaction(function () use ($actor, $data) {
            $id = DB::table('districts')->insertGetId([
                'code' => CatalogCode::unique('districts', Str::upper(Str::limit(Str::slug($data['name']), 9, ''))),
                'name' => $data['name'],
            ]);
            $this->audit->record($actor, 'catalog.district.created', 'catalog.manage', 'district', $id,
                'Alta de distrito de cobertura.', [], ['name' => $data['name']]);

            return DB::table('districts')->find($id);
        });
    }

    public function update(User $actor, int $id, array $data): object
    {
        return DB::transaction(fn () => $this->updates->apply($actor, 'districts', $id, (int) $data['expected_version'],
            CatalogCode::changes($data, self::EDITABLE), [
                'action' => 'catalog.district.updated', 'permission' => 'catalog.manage', 'subject' => 'district',
                'reason' => 'Edición de distrito de cobertura.',
            ]));
    }
}
