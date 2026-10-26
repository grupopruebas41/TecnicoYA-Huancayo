<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Modules\FAdministration\Domain\AnnouncementImages;
use App\Modules\FAdministration\Domain\GeniallyUrl;
use App\Shared\Audit\AuditTrail;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Ciclo administrativo de un comunicado (contrato S2 §8 y S07 §8): borrador → publicado → retirado, y de publicado
 * a borrador al despublicar (D-83). Solo se edita el borrador (D-51); eliminar es retirar con auditoría (RT-05).
 * La columna histórica `audience` se mantiene sincronizada para la API congelada. El orden del carrusel es por
 * audiencia (announcement_audiences.position); la posición 0 es la de los comunicados anteriores al orden manual.
 */
final class ManageAnnouncements
{
    private const FIELDS = ['title', 'body', 'priority', 'link_url', 'link_label', 'source', 'kind', 'image_media_id',
        'mobile_media_id', 'genially_url', 'alt_text'];

    public function __construct(private readonly AuditTrail $audit, private readonly AnnouncementImages $images) {}

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
            $fields = array_intersect_key($data, array_flip(self::FIELDS));
            $fields['body'] = $fields['body'] ?? '';
            DB::table('announcements')->insert($fields + [
                'id' => $id, 'status' => 'draft', 'source' => 'text', 'audience' => $this->legacyAudience($data['audiences']),
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
            if (array_key_exists('body', $changes) && $changes['body'] === null) {
                $changes['body'] = '';
            }
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
            $this->assertComplete($current);
            DB::table('announcements')->where('id', $id)->update([
                'status' => 'published', 'version' => $current->version + 1, 'updated_by' => $actor->id, 'updated_at' => now(),
            ]);
            $this->audit->record($actor, 'announcement.published', 'announcements.manage', 'announcement', null,
                'Publicación de comunicado.', ['id' => $id, 'status' => 'draft'], ['id' => $id, 'status' => 'published']);

            return $this->find($id);
        });
    }

    /** D-83: un publicado vuelve a borrador (sale de los paneles y se puede editar). */
    public function unpublish(User $actor, string $id, int $expectedVersion): object
    {
        return DB::transaction(function () use ($actor, $id, $expectedVersion) {
            $current = $this->lockActive($id);
            if ($current->status !== 'published') {
                throw new HttpResponseException(ApiResponse::error('ANNOUNCEMENT_NOT_PUBLISHED', __('api.announcement_not_published'), 409));
            }
            abort_unless((int) $current->version === $expectedVersion, 409);
            DB::table('announcements')->where('id', $id)->update([
                'status' => 'draft', 'version' => $current->version + 1, 'updated_by' => $actor->id, 'updated_at' => now(),
            ]);
            $this->audit->record($actor, 'announcement.unpublished', 'announcements.manage', 'announcement', null,
                'Comunicado despublicado: vuelve a borrador.', ['id' => $id, 'status' => 'published'], ['id' => $id, 'status' => 'draft']);

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

    /**
     * D-83: orden del carrusel de una audiencia. Debe nombrar una sola vez cada comunicado no retirado de esa
     * audiencia (borradores incluidos, para que al publicarlos ya tengan su lugar).
     *
     * @param  list<string>  $ids
     */
    public function reorder(User $actor, string $audience, array $ids): array
    {
        return DB::transaction(function () use ($actor, $audience, $ids) {
            $roleId = DB::table('roles')->where('code', $audience)->value('id');
            $active = DB::table('announcement_audiences as aud')->join('announcements as a', 'a.id', '=', 'aud.announcement_id')
                ->where('aud.role_id', $roleId)->whereNull('a.retired_at')->lockForUpdate()->pluck('a.id')->all();
            $sorted = $ids;
            sort($sorted);
            sort($active);
            if ($sorted !== $active || count(array_unique($ids)) !== count($ids)) {
                throw ValidationException::withMessages(['ids' => __('api.announcement_order')]);
            }
            $before = $this->order($roleId);
            foreach (array_values($ids) as $index => $id) {
                DB::table('announcement_audiences')->where('announcement_id', $id)->where('role_id', $roleId)->update(['position' => $index + 1]);
            }
            $this->audit->record($actor, 'announcement.reordered', 'announcements.manage', 'announcement', null,
                'Orden del carrusel de comunicados.', ['audience' => $audience, 'ids' => $before], ['audience' => $audience, 'ids' => array_values($ids)]);

            return ['audience' => $audience, 'ids' => array_values($ids)];
        });
    }

    /** Roles de la audiencia de cada comunicado, por id. */
    public function audiences(array $ids): Collection
    {
        return $this->audienceRows($ids)->map(fn (Collection $rows) => $rows->pluck('code')->all());
    }

    /** Posición en el carrusel de cada comunicado, por id y rol: ['client' => 2, 'technician' => 1]. */
    public function positions(array $ids): Collection
    {
        return $this->audienceRows($ids)->map(fn (Collection $rows) => $rows->mapWithKeys(fn (object $row) => [$row->code => (int) $row->position])->all());
    }

    public function find(string $id): object
    {
        return DB::table('announcements')->where('id', $id)->first();
    }

    private function audienceRows(array $ids): Collection
    {
        return DB::table('announcement_audiences as a')->join('roles as r', 'r.id', '=', 'a.role_id')
            ->whereIn('a.announcement_id', $ids)->orderBy('r.code')->get(['a.announcement_id', 'r.code', 'a.position'])
            ->groupBy('announcement_id');
    }

    /** Ids de una audiencia en el orden del carrusel; los anteriores al orden manual (posición 0) van al final. */
    private function order(int $roleId): array
    {
        return DB::table('announcement_audiences')->where('role_id', $roleId)
            ->orderByRaw('CASE WHEN position = 0 THEN 1 ELSE 0 END')->orderBy('position')->pluck('announcement_id')->all();
    }

    /** Al publicar se vuelve a comprobar el contenido: la imagen pudo retirarse después de guardar el borrador. */
    private function assertComplete(object $current): void
    {
        $errors = [];
        if ($current->source === 'image' && ! $this->images->valid($current->image_media_id, 'main')) {
            $errors['image_media_id'] = __('api.announcement_image');
        }
        if ($current->source === 'image' && $current->mobile_media_id !== null && ! $this->images->valid($current->mobile_media_id, 'mobile')) {
            $errors['mobile_media_id'] = __('api.announcement_mobile_image');
        }
        if ($current->source === 'genially' && GeniallyUrl::normalize($current->genially_url) === null) {
            $errors['genially_url'] = __('api.genially_url');
        }
        if ($current->source === 'genially' && $current->image_media_id !== null && ! $this->images->valid($current->image_media_id, 'main')) {
            $errors['image_media_id'] = __('api.announcement_image');
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
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

    /** Conserva la posición de los roles que siguen; cada rol nuevo entra al final de su carrusel. */
    private function replaceAudiences(string $id, array $roles): void
    {
        $roleIds = DB::table('roles')->whereIn('code', $roles)->pluck('id')->all();
        DB::table('announcement_audiences')->where('announcement_id', $id)->whereNotIn('role_id', $roleIds)->delete();
        $kept = DB::table('announcement_audiences')->where('announcement_id', $id)->pluck('role_id')->all();
        foreach (array_diff($roleIds, $kept) as $roleId) {
            DB::table('announcement_audiences')->insert(['announcement_id' => $id, 'role_id' => $roleId, 'position' => $this->nextPosition($roleId)]);
        }
    }

    public function nextPosition(int $roleId): int
    {
        return (int) DB::table('announcement_audiences')->where('role_id', $roleId)->max('position') + 1;
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
