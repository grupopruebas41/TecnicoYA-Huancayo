<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * Alta y edición versionada comunes a especialidades, subcategorías y distritos: una transacción y la auditoría
 * catalog.<tipo>.created|updated con el permiso catalog.manage.
 */
final class CatalogEntries
{
    public function __construct(private readonly AuditTrail $audit, private readonly VersionedUpdate $updates) {}

    /** $row arma la fila dentro de la transacción (código único, orden); se audita el nombre dado de alta. */
    public function create(User $actor, string $table, string $subject, callable $row, string $reason): object
    {
        return DB::transaction(function () use ($actor, $table, $subject, $row, $reason) {
            $values = $row();
            $id = DB::table($table)->insertGetId($values);
            $this->audit->record($actor, "catalog.$subject.created", 'catalog.manage', $subject, $id, $reason, [], ['name' => $values['name']]);

            return DB::table($table)->find($id);
        });
    }

    /** @param  array<string, string>  $editable  campo de la solicitud => columna */
    public function update(User $actor, string $table, string $subject, int $id, array $data, array $editable, string $reason): object
    {
        return DB::transaction(fn () => $this->updates->apply($actor, $table, $id, (int) $data['expected_version'],
            CatalogCode::changes($data, $editable), [
                'action' => "catalog.$subject.updated", 'permission' => 'catalog.manage', 'subject' => $subject, 'reason' => $reason,
            ]));
    }
}
