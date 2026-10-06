<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Comunicados v1: audiencia por rol (announcement_audiences) y vigencia [starts_at, ends_at). */
final class Announcements
{
    private const COPIED = ['title', 'body', 'audience', 'priority', 'image', 'link_url', 'link_label', 'duration_days'];

    public function __construct(private readonly AuditTrail $audit) {}

    /** Comunicados publicados y vigentes para el rol del lector. */
    public function visibleTo(User $reader): Collection
    {
        $now = now();

        return DB::table('announcements as a')
            ->join('announcement_audiences as aud', 'aud.announcement_id', '=', 'a.id')
            ->where('aud.role_id', $reader->role_id)
            ->where('a.status', 'published')->whereNull('a.retired_at')
            ->where(fn ($q) => $q->whereNull('a.starts_at')->orWhere('a.starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('a.ends_at')->orWhere('a.ends_at', '>', $now))
            ->orderByDesc('a.priority')->orderByDesc('a.starts_at')
            ->get(['a.id', 'a.title', 'a.body', 'a.link_url', 'a.link_label', 'a.priority', 'a.starts_at', 'a.ends_at']);
    }

    /** Copia un comunicado como borrador sin fechas: no se publica automáticamente. */
    public function duplicate(User $actor, string $id): object
    {
        return DB::transaction(function () use ($actor, $id) {
            $source = Str::isUuid($id) ? DB::table('announcements')->where('id', $id)->first() : null;
            abort_unless($source, 404);
            $copyId = (string) Str::uuid();
            $copy = array_intersect_key((array) $source, array_flip(self::COPIED));
            DB::table('announcements')->insert($copy + [
                'id' => $copyId, 'status' => 'draft', 'created_by' => $actor->id, 'updated_by' => $actor->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $roles = DB::table('announcement_audiences')->where('announcement_id', $id)->pluck('role_id');
            foreach ($roles as $roleId) {
                DB::table('announcement_audiences')->insert(['announcement_id' => $copyId, 'role_id' => $roleId]);
            }
            $this->audit->record($actor, 'announcement.duplicated', 'announcements.manage', 'announcement', null,
                'Copia en borrador de un comunicado.', ['source_id' => $id], ['copy_id' => $copyId]);

            return DB::table('announcements')->where('id', $copyId)->first();
        });
    }
}
