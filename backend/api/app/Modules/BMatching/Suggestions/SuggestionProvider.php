<?php

namespace App\Modules\BMatching\Suggestions;

/**
 * D-94 (RECO-01): quien propone subcategorías para el texto de un problema. KeywordProvider (diccionario) es el de
 * siempre; LlmProvider (IA) es opcional y solo interviene cuando el diccionario tiene confianza baja.
 */
interface SuggestionProvider
{
    /** 'keywords' o 'ai': lo que la respuesta pública informa como source. */
    public function source(): string;

    public function enabled(): bool;

    /**
     * Ids de subcategoría, el más probable primero (hasta 3).
     *
     * @param  string  $problem  solo el texto del problema, hasta 120 caracteres; nunca datos del usuario
     * @param  list<array{id: int, name: string}>  $catalog  lista cerrada de subcategorías activas
     * @return list<int>
     */
    public function suggest(string $problem, array $catalog): array;
}
