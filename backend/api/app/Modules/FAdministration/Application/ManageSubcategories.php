<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Alta y edición de subcategorías: desactivar conserva identidad y referencias (RN-27). */
final class ManageSubcategories
{
    private const EDITABLE = ['name' => 'name', 'description' => 'description', 'reference_fee' => 'reference_fee',
        'image_id' => 'carousel_media_id', 'active' => 'active'];

    public function __construct(private readonly CatalogEntries $entries) {}

    public function create(User $actor, array $data): object
    {
        return $this->entries->create($actor, 'subcategories', 'subcategory', function () use ($data) {
            $specialtyCode = DB::table('specialties')->where('id', $data['specialty_id'])->value('code');

            return [
                'specialty_id' => $data['specialty_id'],
                'code' => CatalogCode::unique('subcategories', Str::limit($specialtyCode.'-'.Str::slug($data['name']), 74, '')),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'reference_fee' => $data['reference_fee'] ?? null,
                'carousel_media_id' => $data['image_id'] ?? null,
                'display_order' => (int) DB::table('subcategories')->where('specialty_id', $data['specialty_id'])->max('display_order') + 1,
            ];
        }, 'Alta de subcategoría desde el panel administrativo.');
    }

    public function update(User $actor, int $id, array $data): object
    {
        return $this->entries->update($actor, 'subcategories', 'subcategory', $id, $data, self::EDITABLE,
            'Edición de subcategoría desde el panel administrativo.');
    }
}
