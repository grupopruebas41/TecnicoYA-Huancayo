<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Alta y edición de subcategorías: desactivar conserva identidad y referencias (RN-27). */
final class ManageSubcategories
{
    private const EDITABLE = ['name' => 'name', 'description' => 'description', 'reference_fee' => 'reference_fee',
        'image_id' => 'carousel_media_id', 'active' => 'active'];

    public function __construct(private readonly AuditTrail $audit, private readonly VersionedUpdate $updates) {}

    public function create(User $actor, array $data): object
    {
        return DB::transaction(function () use ($actor, $data) {
            $specialtyCode = DB::table('specialties')->where('id', $data['specialty_id'])->value('code');
            $id = DB::table('subcategories')->insertGetId([
                'specialty_id' => $data['specialty_id'],
                'code' => CatalogCode::unique('subcategories', Str::limit($specialtyCode.'-'.Str::slug($data['name']), 74, '')),
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
        return DB::transaction(fn () => $this->updates->apply($actor, 'subcategories', $id, (int) $data['expected_version'],
            CatalogCode::changes($data, self::EDITABLE), [
                'action' => 'catalog.subcategory.updated', 'permission' => 'catalog.manage', 'subject' => 'subcategory',
                'reason' => 'Edición de subcategoría desde el panel administrativo.',
            ]));
    }
}
