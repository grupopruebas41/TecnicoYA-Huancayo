<?php

namespace Database\Factories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Comunicado sintético publicado y vigente. La audiencia se guarda en announcement_audiences
 * (diccionario) y en la columna histórica audience (compatibilidad con la versión anterior).
 *
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    public function definition(): array
    {
        $author = fn () => UserFactory::new()->state(fn () => [
            'role_id' => DB::table('roles')->where('code', 'admin')->value('id'),
        ])->create()->id;

        return [
            'id' => (string) Str::uuid(),
            'title' => 'Comunicado de prueba '.Str::random(6),
            'body' => 'Texto sintético del comunicado.',
            'audience' => 'both',
            'status' => 'published',
            'priority' => 0,
            'starts_at' => now()->subHour(),
            'duration_days' => 1,
            'ends_at' => now()->addDay(),
            'created_by' => $author,
            'updated_by' => fn (array $attributes) => $attributes['created_by'],
        ];
    }

    /** Dirige el comunicado a los roles indicados (client, technician). */
    public function forRoles(array $roles): static
    {
        $legacy = count($roles) === 2 ? 'both' : $roles[0];

        return $this->state(fn () => ['audience' => $legacy])->afterCreating(function (Announcement $announcement) use ($roles) {
            foreach (DB::table('roles')->whereIn('code', $roles)->pluck('id') as $roleId) {
                DB::table('announcement_audiences')->insert(['announcement_id' => $announcement->id, 'role_id' => $roleId]);
            }
        });
    }
}
