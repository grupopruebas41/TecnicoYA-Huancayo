<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Alta y edición de subcategorías: desactivar conserva identidad y referencias (RN-27). */
final class ManageSubcategories
{
    private const EDITABLE = ['name', 'description', 'reference_fee', 'image_id', 'active'];

    public function __construct(private readonly AuditTrail $audit) {}

    public function create(User $actor, array $data): object
    {
        return DB::transaction(function () use ($actor, $data) {
            $specialtyCode = DB::table('specialties')->where('id', $data['specialty_id'])->value('code');
            $id = DB::table('subcategories')->insertGetId([
                'specialty_id' => $data['specialty_id'],
                'code' => $this->uniqueCode($specialtyCode, $data['name']),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'reference_fee' => $data['reference_fee'] ?? null,
                'carousel_media_id' => $data['image_id'] ?? null,
                'display_order' => (int) DB::table('subcategories')->where('specialty_id', $data['specialty_id'])->max('display_order') + 1,
            ]);
            $this->audit->record($actor, 'catalog.subcategory.created', 'catalog.manage', 'subcategory', $id,
                'Alta de subcategoría desde el panel administrativo.', [], ['name' => $data['name']]);

            return DB::table('subcategories')->find($id);
        });
    }

    public function update(User $actor, int $id, array $data): object
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $current = DB::table('subcategories')->lockForUpdate()->find($id);
            abort_unless($current, 404);
            abort_unless((int) $current->version === (int) $data['expected_version'], 409);

            $changes = [];
            foreach (self::EDITABLE as $field) {
                if (array_key_exists($field, $data)) {
                    $column = $field === 'image_id' ? 'carousel_media_id' : $field;
                    $changes[$column] = $field === 'active' ? (int) $data[$field] : $data[$field];
                }
            }
            DB::table('subcategories')->where('id', $id)->update($changes + ['version' => $current->version + 1]);
            $this->audit->record($actor, 'catalog.subcategory.updated', 'catalog.manage', 'subcategory', $id,
                'Edición de subcategoría desde el panel administrativo.',
                array_intersect_key((array) $current, $changes), $changes);

            return DB::table('subcategories')->find($id);
        });
    }

    /** Código estable derivado del rubro y el nombre; se numera si ya existe. */
    private function uniqueCode(string $specialtyCode, string $name): string
    {
        $base = Str::limit($specialtyCode.'-'.Str::slug($name), 74, '');
        $code = $base;
        for ($n = 2; DB::table('subcategories')->where('code', $code)->exists(); $n++) {
            $code = $base.'-'.$n;
        }

        return $code;
    }
}
