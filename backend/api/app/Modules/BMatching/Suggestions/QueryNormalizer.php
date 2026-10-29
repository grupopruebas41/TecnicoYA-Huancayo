<?php

namespace App\Modules\BMatching\Suggestions;

/**
 * D-94 (RECO-01): normaliza consultas y frases del diccionario de la misma forma, para que coincidan.
 * Minúsculas, sin tildes ni signos, sin palabras vacías, singular simple y sinónimos básicos de Huancayo.
 */
final class QueryNormalizer
{
    public const MAX_LENGTH = 120;

    private const ACCENTS = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u'];

    // Palabras sin significado para el problema; «no» se conserva porque cambia el sentido («no enfría»).
    private const STOPWORDS = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis', 'tu', 'su', 'de', 'del',
        'al', 'a', 'y', 'o', 'e', 'en', 'con', 'por', 'para', 'que', 'se', 'me', 'le', 'lo', 'ya', 'muy', 'esta', 'este', 'es',
        'hay', 'tengo', 'tiene', 'estan', 'sus'];

    // Palabras que terminan en «s» y no son plurales.
    private const KEEP = ['virus', 'gas', 'mas', 'tres', 'pais', 'crisis', 'lunes', 'antivirus', 'bus', 'tos'];

    private const SYNONYMS = [
        'compu' => 'computadora', 'pc' => 'computadora', 'ordenador' => 'computadora', 'computador' => 'computadora',
        'notebook' => 'laptop', 'portatil' => 'laptop', 'lap' => 'laptop',
        'refri' => 'refrigeradora', 'refrigerador' => 'refrigeradora', 'nevera' => 'refrigeradora', 'frigider' => 'refrigeradora',
        'congelador' => 'congeladora', 'freezer' => 'congeladora',
        'luz' => 'electricidad', 'corriente' => 'electricidad', 'energia' => 'electricidad',
        'tomacorriente' => 'enchufe', 'toma' => 'enchufe',
        'wifi' => 'internet', 'net' => 'internet',
        'enciende' => 'prende', 'arranca' => 'prende', 'helada' => 'enfria',
    ];

    /** Texto normalizado (tokens separados por un espacio), recortado a 120 caracteres. */
    public function normalize(string $text): string
    {
        return mb_substr(implode(' ', $this->tokens($text)), 0, self::MAX_LENGTH);
    }

    /** @return list<string> */
    public function tokens(string $text): array
    {
        $text = strtr(mb_strtolower(mb_substr($text, 0, 240)), self::ACCENTS);
        $text = preg_replace('/[^a-z0-9]+/', ' ', $text) ?? '';
        $tokens = [];
        foreach (preg_split('/\s+/', trim($text)) ?: [] as $word) {
            if ($word === '' || in_array($word, self::STOPWORDS, true)) {
                continue;
            }
            $word = $this->singular($word);
            $tokens[] = self::SYNONYMS[$word] ?? $word;
        }

        return $tokens;
    }

    private function singular(string $word): string
    {
        $length = strlen($word);
        if ($length <= 3 || ! str_ends_with($word, 's') || in_array($word, self::KEEP, true)) {
            return $word;
        }
        if ($length > 4 && str_ends_with($word, 'ces')) {
            return substr($word, 0, -3).'z';  // luces → luz
        }
        if ($length > 4 && preg_match('/[rlndj]es$/', $word)) {
            return substr($word, 0, -2);  // motores → motor, redes → red
        }

        return substr($word, 0, -1);  // vitrinas → vitrina, clientes → cliente
    }
}
