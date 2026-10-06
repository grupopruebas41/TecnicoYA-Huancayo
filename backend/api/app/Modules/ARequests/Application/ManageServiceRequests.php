<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Registro, corrección, evidencias y envío de solicitudes del cliente de la sesión. Toda operación sobre una
 * solicitud ajena responde 404 (no revela que existe); las que llegan fuera de estado o con versión
 * obsoleta, 409.
 */
final class ManageServiceRequests
{
    public function __construct(private readonly RequestTimeline $timeline) {}

    public function register(User $user, array $data): int
    {
        return DB::transaction(function () use ($user, $data) {
            $clientId = DB::table('client_profiles')->where('user_id', $user->id)->value('id');
            abort_unless($clientId, 403);
            $id = DB::table('service_requests')->insertGetId([
                'client_id' => $clientId,
                'subcategory_id' => $data['subcategory_id'],
                'district_id' => $data['district_id'],
                'description' => $data['description'],
                'address' => $data['address'],
                'mode' => $data['mode'],
                'preferred_start_at' => isset($data['preferred_start_at']) ? now()->parse($data['preferred_start_at'])->utc() : null,
                'preferred_end_at' => isset($data['preferred_end_at']) ? now()->parse($data['preferred_end_at'])->utc() : null,
                'source' => $data['source'],
                'target_technician_id' => $data['target_technician_id'] ?? null,
                // Fotografía de la tarifa referencial del catálogo: no se recalcula si el catálogo cambia.
                'reference_fee_snapshot' => DB::table('subcategories')->where('id', $data['subcategory_id'])->value('reference_fee'),
            ]);
            $this->timeline->record($id, $user->id, 'request.registered', null, 'registered', 'Solicitud registrada por el cliente.', 1);

            return $id;
        });
    }

    public function correct(User $user, int $id, array $data): int
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $request = $this->lockOwnRegistered($user, $id, (int) $data['expected_version']);
            $changes = array_intersect_key($data, array_flip(['description', 'address', 'district_id']));

            return $this->bump($request, $changes, $user->id, 'request.corrected', 'Resumen corregido antes del envío.');
        });
    }

    public function attach(User $user, int $id, array $data): int
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $request = $this->lockOwnRegistered($user, $id, (int) $data['expected_version']);
            DB::table('request_attachments')->insert([
                'request_id' => $id, 'media_id' => $data['media_id'], 'uploaded_by' => $user->id,
                'position' => (int) DB::table('request_attachments')->where('request_id', $id)->max('position') + 1,
                'caption' => $data['caption'] ?? null,
            ]);

            return $this->bump($request, [], $user->id, 'request.attachment_added', 'Foto adjuntada.', ['media_id' => $data['media_id']]);
        });
    }

    public function detach(User $user, int $id, int $mediaId, int $expectedVersion): int
    {
        return DB::transaction(function () use ($user, $id, $mediaId, $expectedVersion) {
            $request = $this->lockOwnRegistered($user, $id, $expectedVersion);
            $deleted = DB::table('request_attachments')->where('request_id', $id)->where('media_id', $mediaId)->delete();
            abort_unless($deleted === 1, 404);

            return $this->bump($request, [], $user->id, 'request.attachment_removed', 'Foto retirada antes del envío.', ['media_id' => $mediaId]);
        });
    }

    /** Confirma el quinto paso. La búsqueda de candidatos se programará en el Sprint 4. */
    public function submit(User $user, int $id, int $expectedVersion): array
    {
        $request = $this->lockOwnRegistered($user, $id, $expectedVersion);
        $version = $this->bump($request, ['status' => 'sent', 'submitted_at' => now()], $user->id,
            'request.submitted', 'Solicitud enviada por el cliente.', [], 'sent');
        $row = DB::table('service_requests')->find($id);

        return ['id' => $row->id, 'status' => $row->status, 'version' => $version, 'submitted_at' => $row->submitted_at];
    }

    private function lockOwnRegistered(User $user, int $id, int $expectedVersion): object
    {
        $request = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->where('r.id', $id)->where('c.user_id', $user->id)->lockForUpdate()->first(['r.*']);
        abort_unless($request, 404);
        abort_unless($request->status === 'registered' && (int) $request->version === $expectedVersion, 409);

        return $request;
    }

    private function bump(object $request, array $changes, int $actorId, string $event, string $summary,
        array $metadata = [], ?string $toStatus = null): int
    {
        $version = (int) $request->version + 1;
        DB::table('service_requests')->where('id', $request->id)->update($changes + ['version' => $version, 'updated_at' => now()]);
        $this->timeline->record($request->id, $actorId, $event, $request->status, $toStatus ?? $request->status, $summary, $version, $metadata);

        return $version;
    }
}
