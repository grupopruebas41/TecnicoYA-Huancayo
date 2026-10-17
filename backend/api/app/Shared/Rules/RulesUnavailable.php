<?php

namespace App\Shared\Rules;

use RuntimeException;

/** Falta la versión de reglas vigente o un parámetro obligatorio de una versión (reglas formalizadas §8). */
final class RulesUnavailable extends RuntimeException {}
