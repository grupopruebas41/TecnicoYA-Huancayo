<?php

namespace App\Modules\ARequests\Http\Requests;

use App\Modules\ARequests\Application\ServiceOrders;
use App\Modules\ARequests\Domain\AttachableEvidence;
use App\Modules\FAdministration\Domain\ActiveSubcategory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator;

/**
 * Pedido con varios rubros (D-92): de 1 a 3 subcategorías distintas con descripción de 20 a 1000 caracteres, hasta 5
 * fotos propias y síntomas de su subcategoría; ubicación y horario comunes. La franja (mañana, tarde o noche en Lima)
 * no puede haber empezado (D-55). La solicitud dirigida no entra en el pedido: sigue siendo de un solo rubro.
 */
final class StoreServiceOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'district_id' => ['required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'address' => StoreServiceRequestRequest::ADDRESS,
            'address_reference' => ['nullable', 'string', 'max:120'],
            'mode' => ['required', Rule::in(['asap', 'scheduled'])],
            'scheduled_date' => ['exclude_unless:mode,scheduled', 'required', 'date_format:Y-m-d'],
            'time_slot' => ['exclude_unless:mode,scheduled', 'required', Rule::in(array_keys(ServiceOrders::SLOTS))],
            'summary_confirmed' => ['required', 'accepted'],
            'items' => ['required', 'array', 'min:1', 'max:'.ServiceOrders::MAX_ITEMS],
            'items.*' => ['array:subcategory_id,description,urgency,brand,model,symptom_ids,media_ids'],
            'items.*.subcategory_id' => ['required', 'integer', 'distinct', new ActiveSubcategory('api.subcategory_unavailable')],
            'items.*.description' => StoreServiceRequestRequest::DESCRIPTION,
            'items.*.urgency' => ['required', Rule::in(['normal', 'urgente'])],
            'items.*.brand' => ['nullable', 'string', 'max:60'],
            'items.*.model' => ['nullable', 'string', 'max:60'],
            'items.*.symptom_ids' => ['nullable', 'array'],
            'items.*.symptom_ids.*' => ['integer', 'distinct'],
            'items.*.media_ids' => ['nullable', 'array', 'max:5'],
            'items.*.media_ids.*' => ['integer', 'distinct', new AttachableEvidence((int) $this->user()->id)],
            'source' => ['prohibited'], 'target_technician_id' => ['prohibited'],
            'client_id' => ['prohibited'], 'status' => ['prohibited'], 'reference_fee' => ['prohibited'],
        ];
    }

    /** Síntomas de la subcategoría de cada rubro y franja que todavía no empezó (hora de Lima). */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            foreach ($this->input('items', []) as $index => $item) {
                foreach (array_values($item['symptom_ids'] ?? []) as $position => $symptomId) {
                    $valid = DB::table('subcategory_symptoms')->where('id', $symptomId)
                        ->where('subcategory_id', $item['subcategory_id'])->where('active', 1)->exists();
                    if (! $valid) {
                        $validator->errors()->add("items.$index.symptom_ids.$position", __('api.order_symptom'));
                    }
                }
            }
            if ($this->input('mode') === 'scheduled' && ServiceOrders::slotStart($this->input('scheduled_date'), $this->input('time_slot'))->lt(CarbonImmutable::now())) {
                $validator->errors()->add('time_slot', __('api.order_time_slot_past'));
            }
        }];
    }

    public function messages(): array
    {
        return [
            'items.required' => __('api.order_items'), 'items.min' => __('api.order_items'), 'items.max' => __('api.order_items'),
            'items.array' => __('api.order_items'),
            'items.*.subcategory_id.distinct' => __('api.order_item_repeated'),
            'items.*.description.required' => __('api.description_length'),
            'items.*.description.min' => __('api.description_length'), 'items.*.description.max' => __('api.description_length'),
            'items.*.urgency.required' => __('api.order_urgency'), 'items.*.urgency.in' => __('api.order_urgency'),
            'items.*.brand.max' => __('api.order_text'), 'items.*.model.max' => __('api.order_text'),
            'items.*.symptom_ids.*.integer' => __('api.order_symptom'), 'items.*.symptom_ids.*.distinct' => __('api.order_symptom'),
            'items.*.media_ids.max' => __('api.order_photos'),
            'items.*.media_ids.*.distinct' => __('api.order_photo_repeated'),
            'scheduled_date.required' => __('api.order_scheduled_date'), 'scheduled_date.date_format' => __('api.order_scheduled_date'),
            'time_slot.required' => __('api.order_time_slot'), 'time_slot.in' => __('api.order_time_slot'),
            'address_reference.max' => __('api.order_address_reference'),
            'summary_confirmed.required' => __('api.summary_confirmation'), 'summary_confirmed.accepted' => __('api.summary_confirmation'),
            'source.prohibited' => __('api.order_targeted'), 'target_technician_id.prohibited' => __('api.order_targeted'),
        ] + StoreServiceRequestRequest::sharedMessages();
    }

    protected function passedValidation(): void
    {
        $key = (string) $this->header('Idempotency-Key');
        if ($key === '' || strlen($key) > 255) {
            throw ValidationException::withMessages(['idempotency_key' => __('api.idempotency_key_required')]);
        }
    }
}
