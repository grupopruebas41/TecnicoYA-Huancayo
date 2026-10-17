<?php

// S04-TC-024 · RNF-01 · D-33: el matching de 300 técnicos elegibles termina en 3 s o menos en MySQL. La carga
// concurrente con k6 sigue en el Sprint 8.
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

/** 300 técnicos sintéticos elegibles insertados por lotes (las fábricas harían 3300 inserciones sueltas). */
function s04BulkTechnicians(int $count): void
{
    $role = DB::table('roles')->where('code', 'technician')->value('id');
    $subcategory = Sprint04::subcategory();
    $district = Sprint04::district();
    $marker = Str::lower(Str::random(8));
    DB::table('users')->insert(array_map(fn ($i) => [
        'role_id' => $role, 'name' => "Técnico masivo $i", 'email' => "masivo-$marker-$i@example.test",
        'password' => 'sin-uso', 'is_active' => 1,
    ], range(1, $count)));
    $users = DB::table('users')->where('email', 'like', "masivo-$marker-%")->orderBy('id')->pluck('id');
    DB::table('technician_profiles')->insert($users->map(fn ($id, $i) => [
        'user_id' => $id, 'display_name' => "Técnico masivo $i", 'status' => 'active', 'verification_status' => 'approved',
        'verified_at' => now()->subDays(1 + $i), 'base_district_id' => $district,
    ])->all());
    $technicians = DB::table('technician_profiles')->whereIn('user_id', $users)->orderBy('id')->pluck('id');
    DB::table('technician_services')->insert($technicians->map(fn ($id, $i) => [
        'technician_id' => $id, 'subcategory_id' => $subcategory, 'reference_fee' => 50 + ($i % 40), 'experience_years' => $i % 12,
    ])->all());
    DB::table('technician_districts')->insert($technicians->map(fn ($id) => ['technician_id' => $id, 'district_id' => $district])->all());
    DB::table('availability_slots')->insert($technicians->map(fn ($id) => [
        'technician_id' => $id, 'kind' => 'weekly', 'weekday' => 2, 'local_start' => '06:00:00', 'local_end' => '22:00:00',
        'valid_from' => '2026-01-01', 'timezone' => 'America/Lima',
    ])->all());
}

it('S04-TC-024 ejecuta el matching de 300 técnicos en 3 segundos o menos', function () {
    s04BulkTechnicians(300);
    $request = Sprint04::sentRequest();

    $start = hrtime(true);
    Sprint04::prepare($request->id);
    $elapsedMs = (hrtime(true) - $start) / 1e6;

    $run = Sprint04::run($request->id);
    $ranked = DB::table('matching_candidates')->where('matching_run_id', $run->id)->where('eligible', 1)
        ->where(fn ($q) => $q->whereNotNull('rank_position')->orWhereNotNull('tie_group'))->count();
    expect($elapsedMs)->toBeLessThan(3000)
        ->and((float) $run->duration_ms)->toEqualWithDelta($elapsedMs, 50)
        ->and($ranked)->toBe(300);
});
