<?php

namespace App\Modules\FAdministration\Domain;

use Illuminate\Support\Facades\DB;

/**
 * Requisitos de RN-24 para habilitar a un técnico. Indica si cada dato existe, sin exponerlo; las claves en
 * español se muestran tal cual en el mensaje de rechazo y en la ficha administrativa.
 */
final class VerificationChecklist
{
    /** @return array<string, bool> */
    public function for(object $profile): array
    {
        return [
            'teléfono' => DB::table('users')->where('id', $profile->user_id)->whereNotNull('phone')->exists(),
            'servicios con tarifa' => DB::table('technician_services')->where('technician_id', $profile->id)->where('active', 1)->exists(),
            'zona de atención' => DB::table('technician_districts')->where('technician_id', $profile->id)->where('active', 1)->exists(),
            'experiencia declarada' => $profile->experience_years !== null,
            'evidencia documental' => DB::table('technician_documents')->where('technician_id', $profile->id)->exists(),
        ];
    }
}
