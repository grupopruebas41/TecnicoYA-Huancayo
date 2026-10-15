<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Portafolio del técnico, separado de sus documentos privados de verificación. Retirar un trabajo lo saca de la
 * galería sin borrar filas ni imágenes (RT-05). Un trabajo ajeno o retirado responde 404.
 */
final class Portfolio
{
    private const EDITABLE = ['title', 'description', 'subcategory_id', 'performed_on', 'status'];

    public function __construct(private readonly OwnTechnicianProfile $profiles) {}

    public function store(User $user, array $data): object
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profiles->lockFor($user);
            $itemId = DB::table('portfolio_items')->insertGetId([
                'technician_id' => $profile->id,
                'subcategory_id' => $data['subcategory_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'performed_on' => $data['performed_on'] ?? null,
                'status' => $data['status'],
            ]);
            $this->replaceImages($itemId, $data['media_ids']);

            return DB::table('portfolio_items')->find($itemId);
        });
    }

    public function update(User $user, int $itemId, array $data): object
    {
        return DB::transaction(function () use ($user, $itemId, $data) {
            $item = $this->lockOwn($user, $itemId);
            abort_unless((int) $item->version === (int) $data['expected_version'], 409);
            DB::table('portfolio_items')->where('id', $itemId)->update(array_intersect_key($data, array_flip(self::EDITABLE)) + [
                'version' => $item->version + 1, 'updated_at' => now(),
            ]);
            if (isset($data['media_ids'])) {
                $this->replaceImages($itemId, $data['media_ids']);
            }

            return DB::table('portfolio_items')->find($itemId);
        });
    }

    public function retire(User $user, int $itemId): void
    {
        DB::transaction(function () use ($user, $itemId) {
            $item = $this->lockOwn($user, $itemId);
            DB::table('portfolio_items')->where('id', $itemId)->update(['status' => 'retired', 'version' => $item->version + 1, 'updated_at' => now()]);
        });
    }

    /** Trabajos no retirados del técnico, con todas sus imágenes (vista del propio técnico). */
    public function ownItems(int $technicianId): array
    {
        return DB::table('portfolio_items')->where('technician_id', $technicianId)->where('status', '!=', 'retired')
            ->orderByDesc('id')->get()->map(fn (object $item) => $this->present($item))->all();
    }

    public function present(object $item): array
    {
        return [
            'id' => $item->id, 'title' => $item->title, 'description' => $item->description, 'subcategory_id' => $item->subcategory_id,
            'performed_on' => $item->performed_on, 'status' => $item->status, 'version' => (int) $item->version, 'images' => $this->images($item->id, false),
        ];
    }

    /** Trabajos publicados de un técnico habilitado; solo imágenes públicas revisadas. */
    public function publicGallery(int $technicianId): array
    {
        $active = DB::table('technician_profiles')->where('id', $technicianId)->where('status', 'active')->exists();
        abort_unless($active, 404);
        $items = DB::table('portfolio_items')->where('technician_id', $technicianId)->where('status', 'published')
            ->orderByDesc('performed_on')->orderByDesc('id')->get(['id', 'title', 'description', 'performed_on']);

        return $items->map(fn (object $item) => (array) $item + ['images' => $this->images($item->id, true)])->all();
    }

    private function lockOwn(User $user, int $itemId): object
    {
        $profile = $this->profiles->lockFor($user);
        $item = DB::table('portfolio_items')->where('id', $itemId)->where('technician_id', $profile->id)
            ->where('status', '!=', 'retired')->lockForUpdate()->first();
        abort_unless($item, 404);

        return $item;
    }

    private function replaceImages(int $itemId, array $mediaIds): void
    {
        DB::table('portfolio_images')->where('portfolio_id', $itemId)->delete();
        foreach (array_values($mediaIds) as $position => $mediaId) {
            DB::table('portfolio_images')->insert(['portfolio_id' => $itemId, 'media_id' => $mediaId, 'position' => $position]);
        }
    }

    private function images(int $itemId, bool $publicOnly): array
    {
        return DB::table('portfolio_images as i')->join('media_files as m', 'm.id', '=', 'i.media_id')
            ->where('i.portfolio_id', $itemId)->whereNull('m.retired_at')
            ->when($publicOnly, fn ($q) => $q->where('m.visibility', 'public')->where('m.scan_status', 'clean'))
            ->orderBy('i.position')->get(['i.media_id', 'i.position', 'i.caption'])
            ->map(fn (object $image) => (array) $image + ['url' => url("/api/v1/media/{$image->media_id}")])->all();
    }
}
