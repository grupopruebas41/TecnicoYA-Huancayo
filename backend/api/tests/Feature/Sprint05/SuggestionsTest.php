<?php

// S05-TC-061 a 067 y 070 a 075 · Buscador «¿Qué se malogró?» (D-94, RECO-01): normalización, motor por diccionario,
// GET /catalog/suggestions, búsquedas sin resultado y proveedor de IA opcional (con FakeSuggestionProvider).
use App\Modules\BMatching\Suggestions\KeywordProvider;
use App\Modules\BMatching\Suggestions\LlmProvider;
use App\Modules\BMatching\Suggestions\QueryNormalizer;
use App\Modules\BMatching\Suggestions\SuggestionProvider;
use Database\Factories\ClientProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\Support\FakeSuggestionProvider;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

function s05Sub(string $code): int
{
    return (int) DB::table('subcategories')->where('code', $code)->value('id');
}

function s05Keyword(string $code, string $phrase, string $kind, int $weight, bool $active = true): void
{
    DB::table('subcategory_keywords')->insert(['subcategory_id' => s05Sub($code), 'phrase' => $phrase,
        'normalized_phrase' => app(QueryNormalizer::class)->normalize($phrase), 'weight' => $weight, 'kind' => $kind,
        'active' => $active, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
}

function s05Suggest(object $test, string $q): array
{
    return $test->getJson('/api/v1/catalog/suggestions?'.http_build_query(['q' => $q]))->assertOk()->json('data');
}

function s05Fake(object $test, FakeSuggestionProvider $fake): FakeSuggestionProvider
{
    app()->instance(SuggestionProvider::class, $fake);

    return $fake;
}

/** Diccionario mínimo de las pruebas: laptop y congeladora, más frases ambiguas en dos especialidades. */
function s05Dictionary(): void
{
    s05Keyword('computo-hardware', 'laptop', 'objeto', 6);
    s05Keyword('computo-hardware', 'no prende', 'general', 3);
    s05Keyword('electricidad-iluminacion', 'no prende', 'general', 3);
    s05Keyword('frio-congeladores', 'congeladora', 'objeto', 6);
    s05Keyword('frio-congeladores', 'no enfría', 'sintoma', 4);
    s05Keyword('frio-congeladores', 'congeladora no enfría', 'sintoma', 9);
    s05Keyword('frio-domestico', 'no enfría', 'sintoma', 4);
}

it('S05-TC-061 normaliza minúsculas, tildes, signos, palabras vacías, plurales y sinónimos', function () {
    $normalizer = app(QueryNormalizer::class);

    expect($normalizer->normalize('¡Mi COMPU ya no PRÉNDE!!'))->toBe('computadora no prende')
        ->and($normalizer->normalize('Las congeladoras de la tienda'))->toBe('congeladora tienda')
        ->and($normalizer->normalize('Se cortó la luz y las luces'))->toBe('corto electricidad electricidad')
        ->and($normalizer->normalize('redes, motores y vitrinas'))->toBe('red motor vitrina')
        ->and($normalizer->normalize('tengo virus en la refri'))->toBe('virus refrigeradora')
        ->and(mb_strlen($normalizer->normalize(str_repeat('congeladora ', 30))))->toBe(QueryNormalizer::MAX_LENGTH);
});

it('S05-TC-062 cuenta primero la frase compuesta y no suma dos veces las mismas palabras', function () {
    s05Dictionary();

    $result = s05Suggest($this, 'Mi congeladora ya no enfría');

    expect($result['source'])->toBe('keywords')->and($result['level'])->toBe('alta')
        ->and(array_column($result['items'], 'subcategory_id'))->toBe([s05Sub('frio-congeladores'), s05Sub('frio-domestico')])
        ->and(array_column($result['items'], 'score'))->toEqual([9, 4])
        ->and($result['items'][0])->toMatchArray(['specialty_name' => 'Refrigeración comercial', 'subcategory_name' => 'Congeladores industriales']);
});

it('S05-TC-063 «no prende» sola es ambigua (vale la mitad) y con «laptop» apunta a hardware', function () {
    s05Dictionary();

    $alone = s05Suggest($this, 'no prende');
    $withObject = s05Suggest($this, 'mi laptop no prende');

    expect($alone['level'])->toBe('baja')->and(array_column($alone['items'], 'score'))->toEqual([1.5, 1.5])
        ->and($withObject['level'])->toBe('alta')
        ->and($withObject['items'][0])->toMatchArray(['subcategory_id' => s05Sub('computo-hardware'), 'score' => 9])
        ->and($withObject['items'][1])->toMatchArray(['subcategory_id' => s05Sub('electricidad-iluminacion'), 'score' => 1.5]);
});

it('S05-TC-064 desempata por el orden del catálogo y devuelve como máximo 3', function () {
    foreach (['frio-climatizacion', 'frio-domestico', 'frio-vitrinas', 'frio-camaras'] as $code) {
        s05Keyword($code, 'no enfría', 'sintoma', 4);
    }

    $items = s05Suggest($this, 'no enfría')['items'];

    expect($items)->toHaveCount(3)
        ->and(array_column($items, 'subcategory_id'))->toBe([s05Sub('frio-domestico'), s05Sub('frio-vitrinas'), s05Sub('frio-camaras')]);
});

it('S05-TC-065 excluye frases inactivas y subcategorías o especialidades inactivas', function () {
    s05Keyword('computo-hardware', 'laptop', 'objeto', 6, active: false);
    s05Keyword('computo-redes', 'laptop', 'objeto', 6);
    s05Keyword('frio-vitrinas', 'laptop', 'objeto', 6);
    s05Keyword('electricidad-iluminacion', 'laptop', 'objeto', 6);
    DB::table('subcategories')->where('code', 'computo-redes')->update(['active' => 0]);
    DB::table('specialties')->where('code', 'electricidad')->update(['active' => 0]);

    expect(array_column(s05Suggest($this, 'laptop')['items'], 'subcategory_id'))->toBe([s05Sub('frio-vitrinas')]);
});

it('S05-TC-066 una búsqueda sin coincidencias se cuenta en keyword_misses sin datos personales', function () {
    $client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($client);

    expect(s05Suggest($this, '¿El quirófano está cerrado?')['items'])->toBe([]);
    s05Suggest($this, 'el quirofano esta cerrado');

    expect(Schema::getColumnListing('keyword_misses'))->toEqualCanonicalizing(['id', 'normalized_query', 'count', 'last_seen_at'])
        ->and(DB::table('keyword_misses')->get(['normalized_query', 'count'])->map(fn ($r) => (array) $r)->all())
        ->toBe([['normalized_query' => 'quirofano cerrado', 'count' => 2]])
        ->and(json_encode(DB::table('keyword_misses')->get()))->not->toContain($client->email)->not->toContain('127.0.0.1');
});

it('S05-TC-067 valida la longitud de la consulta en español y limita las consultas por IP', function () {
    config(['security.suggestions_per_minute' => 3]);

    Sprint01::assertSpanishValidation($this->getJson('/api/v1/catalog/suggestions?q=ab'), ['q']);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/catalog/suggestions?q='.str_repeat('a', 121)), ['q']);
    $this->getJson('/api/v1/catalog/suggestions?q=laptop')->assertOk();

    $this->getJson('/api/v1/catalog/suggestions?q=laptop')->assertStatus(429);
});

it('S05-TC-070 la IA solo se consulta cuando el diccionario tiene confianza baja o no encuentra nada', function () {
    s05Dictionary();
    $fake = s05Fake($this, new FakeSuggestionProvider([s05Sub('computo-hardware')]));

    $high = s05Suggest($this, 'mi laptop no prende');
    expect($high['source'])->toBe('keywords')->and($fake->calls)->toBe([]);

    $low = s05Suggest($this, 'no prende');
    $none = s05Suggest($this, 'mi pantallita hace cosas raras');

    expect([$low['source'], $none['source']])->toBe(['ai', 'ai'])
        ->and($low['items'][0])->toMatchArray(['subcategory_id' => s05Sub('computo-hardware'), 'score' => null])
        ->and($low['level'])->toBe('media')
        ->and($fake->calls)->toHaveCount(2);
});

it('S05-TC-071 descarta los ids de la IA que no están en el catálogo activo y guarda solo los válidos como sugerencias', function () {
    DB::table('subcategories')->where('code', 'frio-vitrinas')->update(['active' => 0]);
    s05Fake($this, new FakeSuggestionProvider([999999, s05Sub('frio-vitrinas'), s05Sub('frio-congeladores')]));

    $result = s05Suggest($this, 'el aparato de las bebidas tiene escarcha');

    expect(array_column($result['items'], 'subcategory_id'))->toBe([s05Sub('frio-congeladores')])
        ->and(DB::table('keyword_suggestions')->get(['normalized_query', 'subcategory_id', 'status'])->map(fn ($r) => (array) $r)->all())
        ->toBe([['normalized_query' => 'aparato bebida escarcha', 'subcategory_id' => s05Sub('frio-congeladores'), 'status' => 'pending']])
        ->and(DB::table('subcategory_keywords')->count())->toBe(0);
});

it('S05-TC-072 guarda en caché la respuesta de la IA por consulta normalizada', function () {
    $fake = s05Fake($this, new FakeSuggestionProvider([s05Sub('computo-redes')]));

    s05Suggest($this, 'El WiFi va lentísimo');
    $second = s05Suggest($this, 'el wifi va lentisimo!!');

    expect($fake->calls)->toHaveCount(1)->and($second['source'])->toBe('ai');
});

it('S05-TC-073 ante un error o un tiempo agotado de la IA responde con el diccionario', function () {
    s05Dictionary();
    s05Fake($this, new FakeSuggestionProvider(error: new ConnectionException('Tiempo agotado')));

    $low = s05Suggest($this, 'no prende');
    $none = s05Suggest($this, 'algo totalmente distinto');

    expect($low['source'])->toBe('keywords')->and($low['items'])->toHaveCount(2)
        ->and($none)->toBe(['source' => 'keywords', 'level' => null, 'items' => []])
        ->and(DB::table('keyword_misses')->value('normalized_query'))->toBe('algo totalmente distinto');
});

it('S05-TC-074 a la IA solo va el texto del problema y la lista cerrada; la clave nunca aparece en logs ni respuestas', function () {
    config(['ai.api_key' => 'sk-secreto-123']);
    $client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($client);
    $fake = s05Fake($this, new FakeSuggestionProvider(error: new RuntimeException('Falló la petición con sk-secreto-123')));
    Log::spy();
    $text = 'Mi '.str_repeat('equipo raro ', 9).'no funciona bien';

    $response = $this->getJson('/api/v1/catalog/suggestions?'.http_build_query(['q' => mb_substr($text, 0, 120)]))->assertOk();

    $call = $fake->calls[0];
    expect($call['problem'])->toBe(mb_substr($text, 0, 120))
        ->and(array_keys($call['catalog'][0]))->toBe(['id', 'name'])
        ->and(json_encode($call))->not->toContain($client->email)->not->toContain($client->name)
        ->and($response->getContent())->not->toContain('sk-secreto');
    Log::shouldHaveReceived('warning')->withArgs(fn (string $message, array $context) => ! str_contains($message.json_encode($context), 'sk-secreto'));
});

it('S05-TC-075 LlmProvider queda desactivado sin proveedor, clave o modelo y, activo, llama a Anthropic con la lista cerrada', function () {
    foreach ([['none', 'k', 'm'], ['anthropic', '', 'm'], ['anthropic', 'k', ''], ['otro', 'k', 'm']] as [$provider, $key, $model]) {
        config(['ai.provider' => $provider, 'ai.api_key' => $key, 'ai.model' => $model]);
        expect(LlmProvider::fromConfig()->enabled())->toBeFalse()
            ->and(app(SuggestionProvider::class))->toBeInstanceOf(KeywordProvider::class);
    }

    config(['ai.provider' => 'anthropic', 'ai.api_key' => 'sk-de-prueba', 'ai.model' => 'modelo-de-prueba', 'ai.timeout' => 4]);
    $hardware = s05Sub('computo-hardware');
    Http::fake(['api.anthropic.com/*' => Http::response(['stop_reason' => 'end_turn', 'content' => [
        ['type' => 'thinking', 'thinking' => ''],
        ['type' => 'text', 'text' => '```json'."\n".'{"subcategory_ids": ['.$hardware.', 999999]}'."\n".'```'],
    ]])]);
    $catalog = [['id' => $hardware, 'name' => 'Cómputo › Reparación de hardware']];

    expect(app(SuggestionProvider::class))->toBeInstanceOf(LlmProvider::class)
        ->and(LlmProvider::fromConfig()->suggest('la laptop no prende', $catalog))->toBe([$hardware]);
    Http::assertSent(function (HttpRequest $request) {
        $body = $request->data();

        return $request->url() === 'https://api.anthropic.com/v1/messages' && $request->hasHeader('x-api-key', 'sk-de-prueba')
            && $request->hasHeader('anthropic-version', '2023-06-01') && $body['model'] === 'modelo-de-prueba'
            && ! array_key_exists('temperature', $body)
            && json_decode($body['messages'][0]['content'], true)['problema'] === 'la laptop no prende';
    });
});
