<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\ManageDistricts;
use App\Modules\FAdministration\Application\ManageSpecialties;
use App\Modules\FAdministration\Application\ManageSubcategories;
use App\Modules\FAdministration\Http\Requests\CreateSubcategoryRequest;
use App\Modules\FAdministration\Http\Requests\DistrictRequest;
use App\Modules\FAdministration\Http\Requests\SpecialtyRequest;
use App\Modules\FAdministration\Http\Requests\UpdateSubcategoryRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Catálogo administrable (contrato S2 §7): incluye lo inactivo, que solo se desactiva y nunca se borra. */
final class AdminCatalogController
{
    public function specialties(): JsonResponse
    {
        $subcategories = DB::table('subcategories')->orderBy('display_order')->orderBy('id')->get()->groupBy('specialty_id');

        return ApiResponse::data(DB::table('specialties')->orderBy('display_order')->orderBy('id')->get()
            ->map(fn (object $row) => $this->specialty($row) + [
                'subcategories' => $subcategories->get($row->id, collect())->map(fn (object $sub) => $this->subcategory($sub))->values()->all(),
            ])->all());
    }

    public function storeSpecialty(SpecialtyRequest $request, ManageSpecialties $specialties): JsonResponse
    {
        return ApiResponse::data($this->specialty($specialties->create($request->user(), $request->validated())), 201);
    }

    public function updateSpecialty(SpecialtyRequest $request, int $specialty, ManageSpecialties $specialties): JsonResponse
    {
        return ApiResponse::data($this->specialty($specialties->update($request->user(), $specialty, $request->validated())));
    }

    public function storeSubcategory(CreateSubcategoryRequest $request, ManageSubcategories $subcategories): JsonResponse
    {
        return ApiResponse::data($this->subcategory($subcategories->create($request->user(), $request->validated())), 201);
    }

    public function updateSubcategory(UpdateSubcategoryRequest $request, int $subcategory, ManageSubcategories $subcategories): JsonResponse
    {
        return ApiResponse::data($this->subcategory($subcategories->update($request->user(), $subcategory, $request->validated())));
    }

    public function districts(): JsonResponse
    {
        return ApiResponse::data(DB::table('districts')->orderBy('id')->get()->map(fn (object $row) => $this->district($row))->all());
    }

    public function storeDistrict(DistrictRequest $request, ManageDistricts $districts): JsonResponse
    {
        return ApiResponse::data($this->district($districts->create($request->user(), $request->validated())), 201);
    }

    public function updateDistrict(DistrictRequest $request, int $district, ManageDistricts $districts): JsonResponse
    {
        return ApiResponse::data($this->district($districts->update($request->user(), $district, $request->validated())));
    }

    private function specialty(object $row): array
    {
        return [
            'id' => $row->id, 'code' => $row->code, 'name' => $row->name, 'description' => $row->description,
            'image_id' => $row->hero_media_id, 'image_url' => $this->mediaUrl($row->hero_media_id),
            'active' => (bool) $row->active, 'version' => (int) $row->version,
        ];
    }

    private function subcategory(object $row): array
    {
        return [
            'id' => $row->id, 'specialty_id' => $row->specialty_id, 'code' => $row->code, 'name' => $row->name,
            'description' => $row->description, 'reference_fee' => $row->reference_fee,
            'image_id' => $row->carousel_media_id, 'image_url' => $this->mediaUrl($row->carousel_media_id),
            'active' => (bool) $row->active, 'version' => (int) $row->version,
        ];
    }

    private function district(object $row): array
    {
        return ['id' => $row->id, 'code' => $row->code, 'name' => $row->name, 'active' => (bool) $row->active, 'version' => (int) $row->version];
    }

    private function mediaUrl(?int $mediaId): ?string
    {
        return $mediaId ? url("/api/v1/media/$mediaId") : null;
    }
}
