<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\ManageSubcategories;
use App\Modules\FAdministration\Http\Requests\CreateSubcategoryRequest;
use App\Modules\FAdministration\Http\Requests\UpdateSubcategoryRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

final class AdminCatalogController
{
    public function __construct(private readonly ManageSubcategories $subcategories) {}

    public function storeSubcategory(CreateSubcategoryRequest $request): JsonResponse
    {
        return ApiResponse::data($this->present($this->subcategories->create($request->user(), $request->validated())), 201);
    }

    public function updateSubcategory(UpdateSubcategoryRequest $request, int $subcategory): JsonResponse
    {
        return ApiResponse::data($this->present($this->subcategories->update($request->user(), $subcategory, $request->validated())));
    }

    private function present(object $row): array
    {
        return [
            'id' => $row->id, 'specialty_id' => $row->specialty_id, 'code' => $row->code, 'name' => $row->name,
            'description' => $row->description, 'reference_fee' => $row->reference_fee,
            'image_id' => $row->carousel_media_id, 'active' => (bool) $row->active, 'version' => (int) $row->version,
        ];
    }
}
