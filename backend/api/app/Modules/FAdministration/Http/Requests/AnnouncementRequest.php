<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Alta (POST) y edición de borrador (PATCH) de un comunicado (contrato S2 §8.2). El texto se guarda tal cual y
 * la SPA lo muestra como texto; el enlace solo admite http y https (SEC-S02-03).
 */
final class AnnouncementRequest extends FormRequest
{
    public function rules(): array
    {
        $editing = $this->isMethod('patch');
        $required = $editing ? ['sometimes', 'required'] : ['required'];

        return [
            'title' => [...$required, 'string', 'min:3', 'max:120'],
            'body' => [...$required, 'string', 'max:5000'],
            'audiences' => [...$required, 'array', 'min:1', 'max:2'],
            'audiences.*' => ['required', 'string', 'distinct', Rule::in(['client', 'technician'])],
            'starts_at' => [...$required, 'date'],
            'ends_at' => [...$required, 'date', ...($this->has('starts_at') ? ['after:starts_at'] : [])],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'link_url' => ['sometimes', 'nullable', 'string', 'max:2048', 'url:http,https'],
            'link_label' => ['sometimes', 'nullable', 'string', 'max:40', 'required_with:link_url'],
            'expected_version' => $editing ? ['required', 'integer', 'min:1'] : ['prohibited'],
            'status' => ['prohibited'], 'id' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return ['link_url.url' => __('api.link_scheme')];
    }
}
