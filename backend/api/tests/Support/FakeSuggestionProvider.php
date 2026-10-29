<?php

namespace Tests\Support;

use App\Modules\BMatching\Suggestions\SuggestionProvider;
use Throwable;

/** IA falsa del buscador (D-94): devuelve ids fijos o lanza un error, y guarda lo que recibió en cada llamada. */
final class FakeSuggestionProvider implements SuggestionProvider
{
    /** @var list<array{problem: string, catalog: array}> */
    public array $calls = [];

    public function __construct(private readonly array $ids = [], private readonly ?Throwable $error = null) {}

    public function source(): string
    {
        return 'ai';
    }

    public function enabled(): bool
    {
        return true;
    }

    public function suggest(string $problem, array $catalog): array
    {
        $this->calls[] = ['problem' => $problem, 'catalog' => $catalog];
        if ($this->error) {
            throw $this->error;
        }

        return $this->ids;
    }
}
