<?php

namespace App\Modules\BMatching\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** POST /offers/{id}/response (contrato S4 §4.3). El motivo no tiene límite hasta que se decida (no se inventa). */
final class RespondOfferRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:accept,reject'],
            'expected_version' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return ['decision.required' => __('api.offer_decision'), 'decision.in' => __('api.offer_decision')];
    }
}
