<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

/**
 * Horario semanal, zonas y pausa propios (D-49): franjas de al menos 30 minutos dentro del día, sin solaparse
 * con otra del mismo día (las contiguas se permiten); la pausa empieza en el minuto actual o después. Un distrito
 * desactivado se conserva si el técnico ya lo tenía, pero no se acepta como zona nueva (D-15).
 */
final class UpdateAvailabilityRequest extends FormRequest
{
    private const MIN_SLOT_MINUTES = 30;

    public function rules(): array
    {
        return [
            'technician_id' => ['prohibited'],
            'slots' => ['present', 'array', 'max:21'],
            'slots.*.weekday' => ['required', 'integer', 'min:1', 'max:7'],
            'slots.*.start' => ['required', 'date_format:H:i'],
            'slots.*.end' => ['required', 'date_format:H:i', 'after:slots.*.start'],
            'district_ids' => ['present', 'array', 'max:20'],
            'district_ids.*' => ['integer', 'distinct', $this->allowedDistrict()],
            'pause' => ['present', 'nullable', 'array'],
            'pause.starts_at' => ['required_with:pause', 'date'],
            'pause.ends_at' => ['nullable', 'date', 'after:pause.starts_at'],
            'pause.reason' => ['nullable', 'string', 'max:255'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [fn (Validator $validator) => $this->checkSlots($validator), fn (Validator $validator) => $this->checkPause($validator)];
    }

    private function allowedDistrict(): Closure
    {
        $technicianId = DB::table('technician_profiles')->where('user_id', $this->user()->id)->value('id');

        return function (string $attribute, mixed $value, Closure $fail) use ($technicianId) {
            $active = DB::table('districts')->where('id', $value)->where('active', 1)->exists();
            $kept = DB::table('technician_districts')->where('technician_id', $technicianId)->where('district_id', $value)->where('active', 1)->exists();
            if (! $active && ! $kept) {
                $fail(__('api.district_inactive'));
            }
        };
    }

    private function checkSlots(Validator $validator): void
    {
        $slots = [];
        foreach ((array) $this->input('slots', []) as $index => $slot) {
            if ($validator->errors()->hasAny(["slots.$index.weekday", "slots.$index.start", "slots.$index.end"])) {
                continue;
            }
            [$start, $end] = [$this->minutes($slot['start']), $this->minutes($slot['end'])];
            if ($end - $start < self::MIN_SLOT_MINUTES) {
                $validator->errors()->add("slots.$index.end", __('api.slot_too_short'));
                continue;
            }
            foreach ($slots as [$weekday, $otherStart, $otherEnd]) {
                if ($weekday === (int) $slot['weekday'] && $start < $otherEnd && $otherStart < $end) {
                    $validator->errors()->add("slots.$index.start", __('api.slot_overlap'));
                    continue 2;
                }
            }
            $slots[] = [(int) $slot['weekday'], $start, $end];
        }
    }

    private function checkPause(Validator $validator): void
    {
        $startsAt = $this->input('pause.starts_at');
        if ($startsAt !== null && ! $validator->errors()->has('pause.starts_at')
            && Carbon::parse($startsAt)->lessThan(now()->startOfMinute())) {
            $validator->errors()->add('pause.starts_at', __('api.pause_in_past'));
        }
    }

    private function minutes(string $time): int
    {
        [$hours, $minutes] = explode(':', $time);

        return (int) $hours * 60 + (int) $minutes;
    }
}
