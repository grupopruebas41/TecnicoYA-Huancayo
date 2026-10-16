<?php

namespace App\Shared\Database;

/**
 * DEF-45: un artisan lanzado a mano no pasa por tests/bootstrap.php y con APP_ENV=testing cae en la base por defecto
 * (tecnicoya). Con APP_ENV=testing, los comandos que borran o siembran datos solo corren contra una base terminada en
 * _testing (o SQLite en memoria), igual que Tests\TestCase. AppServiceProvider la llama al arrancar por consola, antes
 * de que el comando conecte: Laravel no emite CommandStarting con APP_ENV=testing (runningUnitTests).
 */
final class DestructiveCommandGuard
{
    public function check(string $command, ?string $connection): void
    {
        if (! in_array($command, $this->destructiveCommands(), true) || ! app()->environment('testing')) {
            return;
        }
        $connection ??= config('database.default');
        $driver = config("database.connections.$connection.driver");
        $database = (string) config("database.connections.$connection.database");
        $isolated = $driver === 'sqlite' ? $database === ':memory:' : str_ends_with($database, '_testing');
        if (! $isolated) {
            throw new DestructiveCommandRefused("Comando «{$command}» rechazado: con APP_ENV=testing la base «{$database}» "
                .'no termina en _testing. Ejecuta artisan con las variables del slot o con scripts/run-e2e.mjs.');
        }
    }

    /** Comandos que borran o siembran datos. Un método y no una constante, para que la cobertura y la mutación los midan. */
    private function destructiveCommands(): array
    {
        return ['migrate:fresh', 'migrate:refresh', 'migrate:reset', 'db:wipe', 'db:seed'];
    }
}
