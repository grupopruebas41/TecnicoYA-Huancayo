<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Reemplaza horario semanal, zonas y pausa del técnico de la sesión. Las franjas anteriores se desactivan
 * (no se borran); la pausa vigente o futura se cancela si no se envía otra.
 */
final class UpdateAvailability
{
    private const TIMEZONE = 'America/Lima';

    public function __construct(private readonly OwnTechnicianProfile $profiles) {}

    public function execute(User $user, array $data): array
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profiles->lockFor($user, (int) $data['expected_version']);
            $this->replaceSlots($profile->id, $data['slots']);
            $this->replaceDistricts($profile->id, $data['district_ids']);
            $this->replacePause($profile->id, $data['pause']);

            return ['technician_id' => $profile->id, 'version' => $this->profiles->bumpVersion($profile)];
        });
    }

    private function replaceSlots(int $technicianId, array $slots): void
    {
        DB::table('availability_slots')->where('technician_id', $technicianId)->where('active', 1)
            ->update(['active' => 0, 'updated_at' => now()]);
        foreach ($slots as $slot) {
            DB::table('availability_slots')->insert([
                'technician_id' => $technicianId, 'kind' => 'weekly', 'weekday' => $slot['weekday'],
                'local_start' => $slot['start'], 'local_end' => $slot['end'],
                'valid_from' => now(self::TIMEZONE)->toDateString(), 'timezone' => self::TIMEZONE,
            ]);
        }
    }

    private function replaceDistricts(int $technicianId, array $districtIds): void
    {
        DB::table('technician_districts')->where('technician_id', $technicianId)->update(['active' => 0, 'updated_at' => now()]);
        foreach ($districtIds as $districtId) {
            DB::table('technician_districts')->upsert(
                [['technician_id' => $technicianId, 'district_id' => $districtId, 'active' => 1, 'updated_at' => now()]],
                ['technician_id', 'district_id'], ['active', 'updated_at']
            );
        }
    }

    private function replacePause(int $technicianId, ?array $pause): void
    {
        DB::table('technician_pauses')->where('technician_id', $technicianId)->whereNull('cancelled_at')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))
            ->update(['cancelled_at' => now(), 'updated_at' => now()]);
        if ($pause === null) {
            return;
        }
        DB::table('technician_pauses')->insert([
            'technician_id' => $technicianId,
            'starts_at' => Carbon::parse($pause['starts_at'])->utc(),
            'ends_at' => isset($pause['ends_at']) ? Carbon::parse($pause['ends_at'])->utc() : null,
            'reason' => $pause['reason'] ?? null,
        ]);
    }
}
