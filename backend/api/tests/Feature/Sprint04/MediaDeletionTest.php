<?php

// S04-TC-079 a 082 · Transversal D-61 · RF-03, RF-33 · MEDIA-02: DELETE /media/{id} retira una evidencia propia que no
// está adjunta; la vinculada responde 409 y la ajena o ya retirada, 404.
use Database\Factories\ClientProfileFactory;
use Database\Factories\MediaFileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Storage::fake('local');
    $this->owner = ClientProfileFactory::new()->create()->user;
    $this->photo = MediaFileFactory::new()->create([
        'owner_id' => $this->owner->id, 'purpose' => 'evidence', 'mime_type' => 'image/png',
        'storage_key' => 'evidence/'.Illuminate\Support\Str::uuid().'.png', 'original_name' => 'evidencia.png',
    ]);
});

it('S04-TC-079 retira una evidencia propia no vinculada', function () {
    Sanctum::actingAs($this->owner);

    $this->deleteJson("/api/v1/media/{$this->photo->id}")->assertNoContent();

    $audit = DB::table('audit_entries')->where('action', 'media.retired')->first();
    expect(DB::table('media_files')->where('id', $this->photo->id)->value('retired_at'))->not->toBeNull()
        ->and(Storage::disk('local')->exists($this->photo->storage_key))->toBeFalse()
        ->and((int) $audit->actor_id)->toBe($this->owner->id)
        ->and((int) $audit->subject_id)->toBe($this->photo->id);
    $this->getJson("/api/v1/media/{$this->photo->id}")->assertNotFound();
});

it('S04-TC-080 no retira una evidencia adjunta a una solicitud', function () {
    $request = Sprint04::sentRequest(['client_id' => DB::table('client_profiles')->where('user_id', $this->owner->id)->value('id'), 'status' => 'registered']);
    DB::table('request_attachments')->insert(['request_id' => $request->id, 'media_id' => $this->photo->id, 'uploaded_by' => $this->owner->id, 'position' => 1]);
    Sanctum::actingAs($this->owner);

    $this->deleteJson("/api/v1/media/{$this->photo->id}")->assertConflict()->assertJsonPath('error.code', 'MEDIA_LINKED')
        ->assertJsonPath('error.message', 'La foto está adjunta a una solicitud. Quítala primero de la solicitud.');

    expect(DB::table('media_files')->where('id', $this->photo->id)->value('retired_at'))->toBeNull()
        ->and(Storage::disk('local')->exists($this->photo->storage_key))->toBeTrue()
        ->and(DB::table('request_attachments')->where('media_id', $this->photo->id)->count())->toBe(1);
});

it('S04-TC-081 borra archivos según la tabla de decisión por rol', function () {
    $this->deleteJson("/api/v1/media/{$this->photo->id}")->assertUnauthorized();
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->deleteJson("/api/v1/media/{$this->photo->id}")->assertNotFound();

    Sanctum::actingAs($this->owner);
    $this->get("/api/v1/media/{$this->photo->id}")->assertOk();
    expect(DB::table('media_files')->where('id', $this->photo->id)->value('retired_at'))->toBeNull();
});

it('S04-TC-082 no vuelve a retirar una evidencia ya retirada', function () {
    Sanctum::actingAs($this->owner);
    $this->deleteJson("/api/v1/media/{$this->photo->id}")->assertNoContent();

    $this->deleteJson("/api/v1/media/{$this->photo->id}")->assertNotFound();

    expect(DB::table('audit_entries')->where('action', 'media.retired')->count())->toBe(1);
});
