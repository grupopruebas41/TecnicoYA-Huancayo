<?php

namespace App\Shared\Audit;

use App\Models\User;
use App\Shared\Http\ApiResponse;
use Illuminate\Support\Facades\DB;

/**
 * Registro de acciones sensibles (reglas de programación §10). Llamar dentro de la misma transacción
 * que la acción: si la auditoría falla, la operación no se confirma.
 */
final class AuditTrail
{
    public function record(?User $actor, string $action, ?string $permission, string $subjectType, ?int $subjectId,
        string $reason, array $before = [], array $after = []): void
    {
        DB::table('audit_entries')->insert([
            'actor_id' => $actor?->id,
            'actor_kind' => 'user',
            'action' => $action,
            'permission_used' => $permission,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'reason' => $reason,
            'before_values' => $before === [] ? null : json_encode($before, JSON_THROW_ON_ERROR),
            'after_values' => $after === [] ? null : json_encode($after, JSON_THROW_ON_ERROR),
            'correlation_id' => ApiResponse::meta()['request_id'],
            'occurred_at' => now(),
            'source_code' => 'api.v1',
        ]);
    }
}
