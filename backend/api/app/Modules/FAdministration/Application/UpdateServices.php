<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * Declara los servicios del técnico de la sesión. Cada cambio de tarifa crea una versión nueva
 * (service_rate_versions), conserva las anteriores y se audita (SEC-S02-04); los servicios omitidos se desactivan.
 */
final class UpdateServices
{
    public function __construct(private readonly OwnTechnicianProfile $profiles, private readonly AuditTrail $audit) {}

    public function execute(User $user, array $data): array
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profiles->lockFor($user, (int) $data['expected_version']);
            $kept = [];
            foreach ($data['services'] as $service) {
                $kept[] = $this->upsertService($profile->id, $user, (int) $service['subcategory_id'], $this->money($service['reference_fee']));
            }
            DB::table('technician_services')->where('technician_id', $profile->id)->whereNotIn('id', $kept)
                ->update(['active' => 0, 'updated_at' => now()]);

            return ['technician_id' => $profile->id, 'version' => $this->profiles->bumpVersion($profile)];
        });
    }

    private function upsertService(int $technicianId, User $user, int $subcategoryId, string $fee): int
    {
        $current = DB::table('technician_services')->where('technician_id', $technicianId)
            ->where('subcategory_id', $subcategoryId)->lockForUpdate()->first();
        if (! $current) {
            $id = DB::table('technician_services')->insertGetId([
                'technician_id' => $technicianId, 'subcategory_id' => $subcategoryId, 'reference_fee' => $fee,
            ]);
            $this->recordRate($id, 1, $fee, $user->id);

            return $id;
        }
        $changes = ['active' => 1, 'updated_at' => now()];
        if ($this->money($current->reference_fee) !== $fee) {
            $next = (int) $current->current_rate_version + 1;
            $this->recordRate($current->id, $next, $fee, $user->id);
            $this->audit->record($user, 'technician.rate.changed', null, 'technician_service', $current->id,
                'Cambio de tarifa referencial del técnico.',
                ['reference_fee' => $this->money($current->reference_fee), 'rate_version' => (int) $current->current_rate_version],
                ['reference_fee' => $fee, 'rate_version' => $next]);
            $changes += ['reference_fee' => $fee, 'current_rate_version' => $next, 'version' => $current->version + 1];
        }
        DB::table('technician_services')->where('id', $current->id)->update($changes);

        return $current->id;
    }

    private function recordRate(int $serviceId, int $versionNo, string $fee, int $userId): void
    {
        DB::table('service_rate_versions')->insert([
            'technician_service_id' => $serviceId, 'version_no' => $versionNo, 'reference_fee' => $fee,
            'currency' => 'PEN', 'changed_by' => $userId, 'effective_from' => now(),
        ]);
    }

    /** Normaliza a dos decimales para comparar y guardar; importes ya validados (D-48: de 1 a 5000). */
    private function money(string|int|float $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }
}
