<?php

namespace App\Modules\BMatching\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Filtros permitidos de GET /technicians (contrato S3 §5.1; SEC-S03-05). Un filtro desconocido se rechaza en
 * lugar de ignorarse, para que la SPA no crea que filtra por algo que el servidor no aplica.
 * D-88 (BUSQ-01): sort=proximity ordena por cercanía al distrito del filtro o, si no viene, al distrito principal
 * del cliente; max_fee limita la tarifa de referencia.
 */
final class SearchTechniciansRequest extends FormRequest
{
    public const FILTERS = ['specialty_id', 'subcategory_id', 'district_id', 'min_rating', 'max_fee', 'sort', 'page', 'per_page'];

    public function rules(): array
    {
        $subcategory = Rule::exists('subcategories', 'id')->where('active', 1);
        if ($this->filled('specialty_id')) {
            $subcategory->where('specialty_id', (int) $this->query('specialty_id'));
        }

        return [
            'specialty_id' => ['nullable', 'integer', Rule::exists('specialties', 'id')->where('active', 1)],
            'subcategory_id' => ['nullable', 'integer', $subcategory],
            'district_id' => ['nullable', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'min_rating' => ['nullable', 'numeric', 'between:1,5'],
            'max_fee' => ['nullable', 'numeric', 'between:0,10000'],
            'sort' => ['nullable', Rule::in(['name', 'proximity'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ];
    }

    public function messages(): array
    {
        return [
            'specialty_id.exists' => __('api.specialty_unavailable'),
            'subcategory_id.exists' => __('api.search_subcategory'),
            'district_id.exists' => __('api.out_of_coverage'),
            'min_rating.between' => __('api.min_rating_range'),
            'max_fee.numeric' => __('api.max_fee_range'),
            'max_fee.between' => __('api.max_fee_range'),
            'sort.in' => __('api.sort_invalid'),
            'per_page.between' => __('api.per_page_range'),
            'page.min' => __('api.page_invalid'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach (array_diff(array_keys($this->query()), self::FILTERS) as $unknown) {
                $validator->errors()->add((string) $unknown, __('api.filter_not_allowed'));
            }
            if ($this->query('sort') === 'proximity' && $this->origin() === null && ! $validator->errors()->has('district_id')) {
                $validator->errors()->add('sort', __('api.proximity_origin'));
            }
        });
    }

    /** Distrito desde el que se mide la cercanía: el del filtro o el distrito principal del cliente (D-80). */
    public function origin(): ?int
    {
        if ($this->filled('district_id')) {
            return (int) $this->query('district_id');
        }
        $district = DB::table('client_profiles')->where('user_id', $this->user()->id)->value('district_id');

        return $district === null ? null : (int) $district;
    }
}
