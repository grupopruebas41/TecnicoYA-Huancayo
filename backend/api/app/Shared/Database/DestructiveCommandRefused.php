<?php

namespace App\Shared\Database;

use RuntimeException;

/** Comando destructivo detenido por DestructiveCommandGuard antes de abrir la conexión (DEF-45). */
final class DestructiveCommandRefused extends RuntimeException {}
