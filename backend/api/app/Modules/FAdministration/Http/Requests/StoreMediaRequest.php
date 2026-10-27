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

    /** D-83: las imágenes de comunicado (carrusel) pesan hasta 600 KB y son JPG o WebP. */
    public const ANNOUNCEMENT_KILOBYTES = 600;

    public function authorize(EffectivePermissions $permissions): bool
    {
        return match ($this->input('purpose')) {
            'catalog' => $permissions->allows($this->user(), 'catalog.manage'),
            'announcement' => $permissions->allows($this->user(), 'announcements.manage'),
            'portfolio', 'document' => $this->roleCode() === 'technician',
            'evidence' => $this->roleCode() === 'client',
            default => true, // La validación rechaza la finalidad desconocida.
        };
    }

    public function rules(): array
    {
        $types = match (true) {
            $this->isDocument() => 'application/pdf,image/jpeg,image/png',
            $this->isAnnouncement() => 'image/jpeg,image/webp',
            default => 'image/jpeg,image/png,image/webp',
        };
        $max = $this->isAnnouncement() ? self::ANNOUNCEMENT_KILOBYTES : self::MAX_KILOBYTES;

        return [
            // D-77: avatar es la foto de perfil de cualquier cuenta; pasa por ImageSanitizer como el portafolio.
            'purpose' => ['required', Rule::in(['portfolio', 'catalog', 'document', 'evidence', 'avatar', 'announcement'])],
            'file' => ['required', 'file', 'max:'.$max, 'mimetypes:'.$types],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimetypes' => __(match (true) {
                $this->isDocument() => 'api.document_type',
                $this->isAnnouncement() => 'api.announcement_image_type',
                default => 'api.image_type',
            }),
            'file.max' => __($this->isAnnouncement() ? 'api.announcement_image_size' : 'api.file_too_large'),
        ];
    }

    private function roleCode(): ?string
    {
        return DB::table('roles')->where('id', $this->user()->role_id)->value('code');
    }

    private function isAnnouncement(): bool
    {
        return $this->input('purpose') === 'announcement';
    }

    private function isDocument(): bool
    {
        return $this->input('purpose') === 'document';
    }
}
