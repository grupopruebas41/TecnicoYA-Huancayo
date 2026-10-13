<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * Edición administrativa con bloqueo, control de versión (409 si no coincide) y auditoría antes/después.
 * Llamar dentro de una transacción.
 */
final class VersionedUpdate
{
    public function __construct(private readonly AuditTrail $audit) {}

    /** @param  array{action: string, permission: string, subject: string, reason: string}  $audit */
    public function apply(User $actor, string $table, int $id, int $expectedVersion, array $changes, array $audit): object
    {
        $current = DB::table($table)->lockForUpdate()->find($id);
        abort_unless($current, 404);
        abort_unless((int) $current->version === $expectedVersion, 409);
        DB::table($table)->where('id', $id)->update($changes + ['version' => $current->version + 1]);
        $this->audit->record($actor, $audit['action'], $audit['permission'], $audit['subject'], $id, $audit['reason'],
            array_intersect_key((array) $current, $changes), $changes);

        return DB::table($table)->find($id);
    }
}
