<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Shared\Auth\EffectivePermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Subida de un archivo (D-46): imágenes JPG, PNG o WebP para portafolio y catálogo; PDF, JPG o PNG para
 * documentos y JPG, PNG o WebP privadas como evidencia de una solicitud (D-12, solo clientes). Hasta 5 MB. El tipo se comprueba por contenido (finfo), no por la extensión.
 */
final class StoreMediaRequest extends FormRequest
{
    public const MAX_KILOBYTES = 5120;

    public function authorize(EffectivePermissions $permissions): bool
    {
        return match ($this->input('purpose')) {
            'catalog' => $permissions->allows($this->user(), 'catalog.manage'),
            'portfolio', 'document' => $this->roleCode() === 'technician',
            'evidence' => $this->roleCode() === 'client',
            default => true, // La validación rechaza la finalidad desconocida.
        };
    }

    public function rules(): array
    {
        $types = $this->isDocument() ? 'application/pdf,image/jpeg,image/png' : 'image/jpeg,image/png,image/webp';

        return [
            'purpose' => ['required', Rule::in(['portfolio', 'catalog', 'document', 'evidence'])],
            'file' => ['required', 'file', 'max:'.self::MAX_KILOBYTES, 'mimetypes:'.$types],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimetypes' => __($this->isDocument() ? 'api.document_type' : 'api.image_type'),
            'file.max' => __('api.file_too_large'),
        ];
    }

    private function roleCode(): ?string
    {
        return DB::table('roles')->where('id', $this->user()->role_id)->value('code');
    }

    private function isDocument(): bool
    {
        return $this->input('purpose') === 'document';
    }
}
