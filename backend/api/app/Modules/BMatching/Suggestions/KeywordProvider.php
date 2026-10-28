<?php

namespace App\Modules\BMatching\Suggestions;

/** Proveedor por defecto: el diccionario de palabras clave (no sale del servidor ni usa servicios externos). */
final class KeywordProvider implements SuggestionProvider
{
    public function __construct(private readonly KeywordEngine $engine) {}

    public function source(): string
    {
        return 'keywords';
    }

    public function enabled(): bool
    {
        return true;
    }

    public function suggest(string $problem, array $catalog): array
    {
        return array_column($this->engine->search($problem)['items'], 'subcategory_id');
    }
}
