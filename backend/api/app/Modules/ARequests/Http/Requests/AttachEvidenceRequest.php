<?php

namespace App\Modules\ARequests\Http\Requests;

use App\Modules\ARequests\Domain\AttachableEvidence;
use Illuminate\Foundation\Http\FormRequest;

final class AttachEvidenceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'media_id' => ['required', 'integer', new AttachableEvidence((int) $this->user()->id)],
            'caption' => ['nullable', 'string', 'max:180'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
