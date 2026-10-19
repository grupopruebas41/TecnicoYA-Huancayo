<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class CatalogController
{
    /** La foto (hero_media_id) solo se expone si es pública, revisada y no retirada, como en el carrusel (S04-TC-133). */
    public function specialties(): JsonResponse
    {
        $items = DB::table('specialties as p')
            ->leftJoin('media_files as m', fn ($join) => $join->on('m.id', '=', 'p.hero_media_id')
                ->where('m.visibility', 'public')->where('m.scan_status', 'clean')->whereNull('m.retired_at'))
            ->where('p.active', 1)->orderBy('p.display_order')->orderBy('p.id')
            ->get(['p.id', 'p.code', 'p.name', 'p.description', 'm.id as media_id']);

        return ApiResponse::data($items->map(fn (object $item) => [
            'id' => $item->id, 'code' => $item->code, 'name' => $item->name, 'description' => $item->description,
            'image_url' => $item->media_id ? url("/api/v1/media/{$item->media_id}") : null,
        ])->all());
    }

    public function subcategories(Request $request): JsonResponse
    {
        $filter = $request->validate(['specialty_id' => ['required', 'integer', 'exists:specialties,id']]);
        $items = DB::table('subcategories as s')->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('p.active', 1)->where('s.active', 1)->where('s.specialty_id', $filter['specialty_id'])
            ->orderBy('s.display_order')->orderBy('s.id')
            ->get(['s.id', 's.specialty_id', 's.code', 's.name', 's.description', 's.carousel_media_id']);

        // La foto del carrusel solo se expone como URL del archivo revisado; nunca la clave de almacenamiento.
        return ApiResponse::data($items->map(fn (object $item) => [
            'id' => $item->id, 'specialty_id' => $item->specialty_id, 'code' => $item->code,
            'name' => $item->name, 'description' => $item->description,
            'image_url' => $item->carousel_media_id ? url("/api/v1/media/{$item->carousel_media_id}") : null,
        ])->all());
    }

    /** Carrusel de la landing (HU-S02-01): solo lo activo con imagen pública, revisada y no retirada. */
    public function carousel(): JsonResponse
    {
        $items = DB::table('subcategories as s')->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->join('media_files as m', 'm.id', '=', 's.carousel_media_id')
            ->where('s.active', 1)->where('p.active', 1)
            ->where('m.visibility', 'public')->where('m.scan_status', 'clean')->whereNull('m.retired_at')
            ->orderBy('p.display_order')->orderBy('p.id')->orderBy('s.display_order')->orderBy('s.id')
            ->get(['s.id', 's.specialty_id', 'p.name as specialty_name', 's.name', 's.description', 's.carousel_media_id']);

        return ApiResponse::data($items->map(fn (object $item) => [
            'subcategory_id' => $item->id, 'specialty_id' => $item->specialty_id, 'specialty_name' => $item->specialty_name,
            'name' => $item->name, 'description' => $item->description, 'image_url' => url("/api/v1/media/{$item->carousel_media_id}"),
        ])->all());
    }

    /** Distritos activos para el selector de zona (D-15). */
    public function districts(): JsonResponse
    {
        return ApiResponse::data(DB::table('districts')->where('active', 1)->orderBy('id')->get(['id', 'code', 'name'])->toArray());
    }
}
