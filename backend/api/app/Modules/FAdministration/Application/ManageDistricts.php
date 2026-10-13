<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Str;

/** Distritos de cobertura (D-15): ampliables por el administrador; desactivar conserva las zonas ya asignadas. */
final class ManageDistricts
{
    private const EDITABLE = ['name' => 'name', 'active' => 'active'];

    public function __construct(private readonly CatalogEntries $entries) {}

    public function create(User $actor, array $data): object
    {
        return $this->entries->create($actor, 'districts', 'district', fn () => [
            'code' => CatalogCode::unique('districts', Str::upper(Str::limit(Str::slug($data['name']), 9, ''))),
            'name' => $data['name'],
        ], 'Alta de distrito de cobertura.');
    }

    public function update(User $actor, int $id, array $data): object
    {
        return $this->entries->update($actor, 'districts', 'district', $id, $data, self::EDITABLE, 'Edición de distrito de cobertura.');
    }
}
