<?php

namespace App\Shared\Http;

use App\Models\User;
use Closure;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Comandos con Idempotency-Key (diseño técnico): misma clave y mismo cuerpo devuelven el resultado
 * guardado; otro cuerpo con la misma clave es 409. El registro y el cambio se confirman en la misma
 * transacción, así que un comando que falla no deja clave consumida.
 *
 * La clave se reserva insertándola primero (S4): un SELECT … FOR UPDATE de una clave que aún no existe toma
 * bloqueos de hueco en InnoDB, y dos peticiones concurrentes que luego insertan se bloqueaban entre sí (deadlock).
 * Con la inserción, la misma clave espera a la primera y otra clave no compite.
 */
final class Idempotency
{
    /** @param Closure(): array{0:int,1:array} $command devuelve [estado HTTP, data] */
    public function run(User $user, string $operation, string $key, array $payload, Closure $command): array
    {
        return DB::transaction(function () use ($user, $operation, $key, $payload, $command) {
            $keyHash = hash('sha256', $key);
            $requestHash = hash('sha256', json_encode($this->canonical($payload), JSON_THROW_ON_ERROR));
            // Una clave vencida deja de proteger: se libera para no chocar con la restricción única.
            $expired = DB::table('idempotency_records')->where('user_id', $user->id)->where('operation', $operation)
                ->where('key_hash', $keyHash)->where('expires_at', '<=', now())->value('id');
            if ($expired) {
                DB::table('idempotency_records')->where('id', $expired)->delete();
            }
            try {
                $id = DB::table('idempotency_records')->insertGetId([
                    'user_id' => $user->id, 'operation' => $operation, 'key_hash' => $keyHash, 'request_hash' => $requestHash,
                    'status' => 'processing', 'expires_at' => now()->addDays(config('marketplace.idempotency_retention_days')),
                ]);
            } catch (UniqueConstraintViolationException) {
                $previous = DB::table('idempotency_records')->where('user_id', $user->id)->where('operation', $operation)
                    ->where('key_hash', $keyHash)->lockForUpdate()->first();
                abort_unless($previous && $previous->status === 'completed' && $previous->request_hash === $requestHash, 409);

                return [(int) $previous->response_status, json_decode($previous->response_body, true, 512, JSON_THROW_ON_ERROR)];
            }

            [$status, $data] = $command();
            DB::table('idempotency_records')->where('id', $id)->update([
                'status' => 'completed', 'response_status' => $status, 'response_body' => json_encode($data, JSON_THROW_ON_ERROR),
            ]);

            return [$status, $data];
        });
    }

    private function canonical(array $payload): array
    {
        ksort($payload);

        return array_map(fn ($value) => is_array($value) ? $this->canonical($value) : $value, $payload);
    }
}
