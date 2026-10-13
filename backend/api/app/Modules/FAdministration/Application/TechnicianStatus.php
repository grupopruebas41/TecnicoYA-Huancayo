<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * Cambios de estado del técnico fuera de la revisión (D-32, D-50):
 * - suspender (solo activo): cierra sus sesiones; no borra trabajos, documentos ni tarifas (SEC-S02-04);
 * - reactivar (solo suspendido): vuelve a activo;
 * - pedir nueva revisión (el propio técnico, solo si fue rechazado): vuelve a pendiente.
 * Toda transición no permitida o con versión vieja responde 409.
 */
final class TechnicianStatus
{
    public function __construct(private readonly AuditTrail $audit, private readonly OwnTechnicianProfile $profiles) {}

    public function suspend(User $actor, int $technicianId, array $data): object
    {
        return $this->transition($actor, $technicianId, $data, 'active', 'suspended', 'technician.suspended');
    }

    public function reactivate(User $actor, int $technicianId, array $data): object
    {
        return $this->transition($actor, $technicianId, $data, 'suspended', 'active', 'technician.reactivated');
    }

    public function requestReview(User $technician, int $expectedVersion): object
    {
        return DB::transaction(function () use ($technician, $expectedVersion) {
            $profile = $this->profiles->lockFor($technician, $expectedVersion);
            abort_unless($profile->status === 'pending_verification' && $profile->verification_status === 'rejected', 409);
            DB::table('technician_profiles')->where('id', $profile->id)
                ->update(['verification_status' => 'pending', 'version' => $profile->version + 1, 'updated_at' => now()]);
            $this->audit->record($technician, 'technician.verification_requested', null, 'technician_profile', $profile->id,
                'El técnico pide una nueva revisión tras corregir su perfil.', ['verification_status' => 'rejected'], ['verification_status' => 'pending']);

            return DB::table('technician_profiles')->find($profile->id);
        });
    }

    private function transition(User $actor, int $technicianId, array $data, string $from, string $to, string $action): object
    {
        return DB::transaction(function () use ($actor, $technicianId, $data, $from, $to, $action) {
            $profile = DB::table('technician_profiles')->lockForUpdate()->find($technicianId);
            abort_unless($profile, 404);
            abort_unless((int) $profile->version === (int) $data['expected_version'] && $profile->status === $from, 409);
            DB::table('technician_profiles')->where('id', $profile->id)
                ->update(['status' => $to, 'version' => $profile->version + 1, 'updated_at' => now()]);
            if ($to === 'suspended') {
                DB::table('sessions')->where('user_id', $profile->user_id)->delete(); // D-32
            }
            $this->audit->record($actor, $action, 'technicians.verify', 'technician_profile', $profile->id, $data['reason'],
                ['status' => $from], ['status' => $to]);

            return DB::table('technician_profiles')->find($profile->id);
        });
    }
}
