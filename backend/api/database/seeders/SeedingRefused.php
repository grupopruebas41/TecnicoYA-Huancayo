<?php

namespace Database\Seeders;

use RuntimeException;

/** Semilla que no puede ejecutarse (datos de origen ilegibles o entorno no permitido). */
final class SeedingRefused extends RuntimeException {}
