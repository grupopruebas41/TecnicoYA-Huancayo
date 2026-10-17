<?php

// S04-TC-053, 054, 055 y 058 · HU-S04-07 · RF-16, RF-17; RN-11.1 · D-21, D-22: reasignación por rondas sin repetir
// técnicos; el vencimiento y los rechazos abren una sola ronda nueva; con alguna aceptación se espera la elección.
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->technicians = array_map(fn ($fee) => Sprint04::technician(['fee' => $fee]), ['60.00', '65.00', '70.00', '75.00', '80.00', '85.00']);
    $this->request = Sprint04::sentRequest();
    Sprint04::prepare($this->request->id);
    $this->round = Sprint04::rounds($this->request->id)[0];
});

function s04Ids(array $technicians): array
{
    return array_map(fn ($t) => $t->id, $technicians);
}

it('S04-TC-053 abre una sola ronda nueva aunque el vencimiento corra dos veces [TC-051]', function () {
    $this->travel(10)->minutes();

    Sprint04::expireRound($this->round->id);
    Sprint04::expireRound($this->round->id);

    $rounds = Sprint04::rounds($this->request->id);
    expect($rounds)->toHaveCount(2)
        ->and($rounds[0]->status)->toBe('closed')
        ->and(DB::table('offers')->where('round_id', $this->round->id)->pluck('status')->unique()->values()->all())->toBe(['expired'])
        ->and(Sprint04::offeredIn($this->round->id))->toBe(s04Ids(array_slice($this->technicians, 0, 3)))
        ->and(Sprint04::offeredIn($rounds[1]->id))->toBe(s04Ids(array_slice($this->technicians, 3, 3)));
});

it('S04-TC-054 abre la siguiente ronda al tercer rechazo sin esperar el plazo', function () {
    $this->travel(3)->minutes();
    foreach (array_slice($this->technicians, 0, 3) as $technician) {
        Sprint04::respond($this, $technician, Sprint04::offerTo($this->request->id, $technician->id), 'reject')->assertOk();
    }
    $afterRejects = Sprint04::rounds($this->request->id);

    $this->travel(7)->minutes();
    Sprint04::expireRound($this->round->id);

    expect($afterRejects)->toHaveCount(2)
        ->and($afterRejects[0]->status)->toBe('closed')
        ->and(Sprint04::rounds($this->request->id))->toHaveCount(2);
});

it('S04-TC-055 espera la elección cuando la ronda tiene alguna aceptación', function () {
    Sprint04::respond($this, $this->technicians[0], Sprint04::offerTo($this->request->id, $this->technicians[0]->id), 'accept')->assertOk();
    $this->travel(10)->minutes();

    Sprint04::expireRound($this->round->id);

    expect(DB::table('offers')->where('round_id', $this->round->id)->orderBy('technician_id')->pluck('status')->all())->toBe(['accepted', 'expired', 'expired'])
        ->and(DB::table('offer_rounds')->where('id', $this->round->id)->value('status'))->toBe('awaiting_choice')
        ->and(Sprint04::rounds($this->request->id))->toHaveCount(1);
});

it('S04-TC-058 no vuelve a ofrecer a quien ya tuvo oferta en la solicitud', function () {
    DB::table('technician_profiles')->where('id', $this->technicians[5]->id)->update(['status' => 'suspended']);
    $this->travel(10)->minutes();

    Sprint04::expireRound($this->round->id);

    $rounds = Sprint04::rounds($this->request->id);
    expect(Sprint04::offeredIn($rounds[1]->id))->toBe(s04Ids(array_slice($this->technicians, 3, 2)))
        ->and(DB::table('offers')->where('request_id', $this->request->id)->select('technician_id')->groupBy('technician_id')->havingRaw('count(*) > 1')->get())->toHaveCount(0);
});
