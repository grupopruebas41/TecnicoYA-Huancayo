<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\DocumentFile;
use Illuminate\Foundation\Http\FormRequest;

/** Registro de un documento de verificación ya subido con POST /media (purpose=document). */
final class StoreDocumentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'technician_id' => ['prohibited'],
            'media_id' => ['required', 'integer', new DocumentFile((int) $this->user()->id)],
            'document_type' => ['required', 'string', 'min:2', 'max:60'],
        ];
    }
}
