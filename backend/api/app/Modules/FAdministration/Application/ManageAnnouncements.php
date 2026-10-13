<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Ciclo administrativo de un comunicado (contrato S2 §8): borrador → publicado → retirado.
 * Solo se edita el borrador (D-51); eliminar es retirar con auditoría (RT-05). La columna histórica `audience`
 * se mantiene sincronizada para la API congelada.
 */
final class ManageAnnouncements
{
    private const FIELDS = ['title', 'body', 'priority', 'link_url', 'link_label'];

    public function __construct(private readonly AuditTrail $audit) {}

    public function list(?string $status): Collection
    {
        return DB::table('announcements')
            ->when($status === 'retired', fn ($q) => $q->whereNotNull('retired_at'))
            ->when(in_array($status, ['draft', 'published'], true), fn ($q) => $q->whereNull('retired_at')->where('status', $status))
            ->orderByDesc('created_at')->orderBy('id')->get();
    }

    public function create(User $actor, array $data): object
    {
        return DB::transaction(function () use ($actor, $data) {
            $id = (string) Str::uuid();
            [$startsAt, $endsAt] = [Carbon::parse($data['starts_at'])->utc(), Carbon::parse($data['ends_at'])->utc()];
            DB::table('announcements')->insert(array_intersect_key($data, array_flip(self::FIELDS)) + [
                'id' => $id, 'status' => 'draft', 'audience' => $this->legacyAudience($data['audiences']),
                'starts_at' => $startsAt, 'ends_at' => $endsAt, 'duration_days' => $this->durationDays($startsAt, $endsAt),
                'created_by' => $actor->id, 'updated_by' => $actor->id, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $this->replaceAudiences($id, $data['audiences']);
            $this->audit->record($actor, 'announcement.created', 'announcements.manage', 'announcement', null,
                'Alta de comunicado en borrador.', [], ['id' => $id, 'title' => $data['title']]);

            return $this->find($id);
        });
    }

    public function update(User $actor, string $id, array $data): object
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $current = $this->lockDraft($id, (int) $data['expected_version']);
            $startsAt = Carbon::parse($data['starts_at'] ?? $current->starts_at)->utc();
            $endsAt = Carbon::parse($data['ends_at'] ?? $current->ends_at)->utc();
            if ($endsAt->lessThanOrEqualTo($startsAt)) {
                throw ValidationException::withMessages(['ends_at' => __('validation.after', [
                    'attribute' => __('validation.attributes.ends_at'), 'date' => __('validation.attributes.starts_at'),
                ])]);
            }
            $changes = array_intersect_key($data, array_flip(self::FIELDS)) + [
                'starts_at' => $startsAt, 'ends_at' => $endsAt, 'duration_days' => $this->durationDays($startsAt, $endsAt),
            ];
            if (isset($data['audiences'])) {
                $changes['audience'] = $this->legacyAudience($data['audiences']);
                $this->replaceAudiences($id, $data['audiences']);
            }
            DB::table('announcements')->where('id', $id)->update($changes + [
                'version' => $current->version + 1, 'updated_by' => $actor->id, 'updated_at' => now(),
            ]);
            $this->audit->record($actor, 'announcement.updated', 'announcements.manage', 'announcement', null,
                'Edición de comunicado en borrador.', ['id' => $id, 'title' => $current->title], ['id' => $id] + array_intersect_key($data, array_flip(['title'])));

            return $this->find($id);
        });
    }

    public function publish(User $actor, string $id, int $expectedVersion): object
    {
        return DB::transaction(function () use ($actor, $id, $expectedVersion) {
            $current = $this->lockDraft($id, $expectedVersion);
            if ($current->ends_at === null || Carbon::parse($current->ends_at)->lessThanOrEqualTo(now())) {
                throw ValidationException::withMessages(['ends_at' => __('api.announcement_expired')]);
            }
            DB::table('announcements')->where('id', $id)->update([
                'status' => 'published', 'version' => $current->version + 1, 'updated_by' => $actor->id, 'updated_at' => now(),
            ]);
            $this->audit->record($actor, 'announcement.published', 'announcements.manage', 'announcement', null,
                'Publicación de comunicado.', ['id' => $id, 'status' => 'draft'], ['id' => $id, 'status' => 'published']);

            return $this->find($id);
        });
    }

    public function retire(User $actor, string $id): void
    {
        DB::transaction(function () use ($actor, $id) {
            $current = $this->lockActive($id);
            DB::table('announcements')->where('id', $id)->update([
                'status' => 'archived', 'retired_at' => now(), 'version' => $current->version + 1,
                'updated_by' => $actor->id, 'updated_at' => now(),
            ]);
            $this->audit->record($actor, 'announcement.retired', 'announcements.manage', 'announcement', null,
                'Comunicado retirado desde el panel administrativo.', ['id' => $id, 'status' => $current->status], ['id' => $id, 'status' => 'retired']);
        });
    }

    /** Roles de la audiencia de cada comunicado, por id. */
    public function audiences(array $ids): Collection
    {
        return DB::table('announcement_audiences as a')->join('roles as r', 'r.id', '=', 'a.role_id')
            ->whereIn('a.announcement_id', $ids)->orderBy('r.code')->get(['a.announcement_id', 'r.code'])
            ->groupBy('announcement_id')->map(fn (Collection $rows) => $rows->pluck('code')->all());
    }

    public function find(string $id): object
    {
        return DB::table('announcements')->where('id', $id)->first();
    }

    private function lockActive(string $id): object
    {
        $current = Str::isUuid($id) ? DB::table('announcements')->where('id', $id)->whereNull('retired_at')->lockForUpdate()->first() : null;
        abort_unless($current, 404);

        return $current;
    }

    private function lockDraft(string $id, int $expectedVersion): object
    {
        $current = $this->lockActive($id);
        if ($current->status !== 'draft') {
            throw new HttpResponseException(ApiResponse::error('ANNOUNCEMENT_NOT_EDITABLE', __('api.announcement_not_editable'), 409));
        }
        abort_unless((int) $current->version === $expectedVersion, 409);

        return $current;
    }

    private function replaceAudiences(string $id, array $roles): void
    {
        DB::table('announcement_audiences')->where('announcement_id', $id)->delete();
        foreach (DB::table('roles')->whereIn('code', $roles)->pluck('id') as $roleId) {
            DB::table('announcement_audiences')->insert(['announcement_id' => $id, 'role_id' => $roleId]);
        }
    }

    /** Valor de la columna histórica `audience` (client, technician o both). */
    private function legacyAudience(array $roles): string
    {
        return count(array_unique($roles)) === 2 ? 'both' : $roles[0];
    }

    private function durationDays(Carbon $startsAt, Carbon $endsAt): int
    {
        return max(1, min(65535, (int) ceil($startsAt->diffInMinutes($endsAt) / 1440)));
    }
}
