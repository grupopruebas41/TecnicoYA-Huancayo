<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Portafolio público del técnico, separado de sus documentos privados de verificación. */
final class Portfolio
{
    public function __construct(private readonly OwnTechnicianProfile $profiles) {}

    public function store(User $user, array $data): int
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
            foreach (array_values($data['media_ids']) as $position => $mediaId) {
                DB::table('portfolio_images')->insert(['portfolio_id' => $itemId, 'media_id' => $mediaId, 'position' => $position]);
            }

            return $itemId;
        });
    }

    /** Trabajos publicados de un técnico habilitado; solo imágenes públicas revisadas. */
    public function publicGallery(int $technicianId): array
    {
        $active = DB::table('technician_profiles')->where('id', $technicianId)->where('status', 'active')->exists();
        abort_unless($active, 404);
        $items = DB::table('portfolio_items')->where('technician_id', $technicianId)->where('status', 'published')
            ->orderByDesc('performed_on')->orderByDesc('id')->get(['id', 'title', 'description', 'performed_on']);

        return $items->map(fn (object $item) => (array) $item + ['images' => $this->images($item->id)])->all();
    }

    private function images(int $itemId): array
    {
        return DB::table('portfolio_images as i')->join('media_files as m', 'm.id', '=', 'i.media_id')
            ->where('i.portfolio_id', $itemId)->where('m.visibility', 'public')->where('m.scan_status', 'clean')
            ->whereNull('m.retired_at')->orderBy('i.position')
            ->get(['i.media_id', 'i.position', 'i.caption'])
            ->map(fn (object $image) => (array) $image + ['url' => url("/api/v1/media/{$image->media_id}")])->all();
    }
}
