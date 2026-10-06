<?php

namespace App\Console\Commands;

use App\Modules\FAdministration\Application\ProvisionAdministrator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Throwable;

final class ProvisionAdmin extends Command
{
    protected $signature = 'tecnicoya:provision-admin {--email=} {--name=}';

    protected $description = 'Crea un administrador desde consola con auditoría y contraseña oculta';

    public function handle(ProvisionAdministrator $provision): int
    {
        $data = [
            'email' => mb_strtolower(trim((string) $this->option('email'))),
            'name' => trim((string) $this->option('name')),
        ];
        $validator = Validator::make($data, [
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'name' => ['required', 'string', 'min:2', 'max:100'],
        ]);
        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        $password = $this->secret('Contraseña del administrador');
        $confirmation = $this->secret('Confirma la contraseña');
        // Conserva el mínimo de 12 del comando administrativo histórico.
        if (! is_string($password) || mb_strlen($password) < 12 || strlen($password) > 72 || $password !== $confirmation) {
            $this->error('La contraseña debe tener al menos 12 caracteres, no superar 72 bytes y coincidir con su confirmación.');

            return self::FAILURE;
        }
        try {
            $provision->execute($data['email'], $data['name'], $password);
        } catch (Throwable $error) {
            // No imprimir la excepción SQL: podría contener el hash o datos personales.
            $this->error('No se creó la cuenta. Revisa el correo, las semillas de autorización y la disponibilidad de auditoría.');

            return self::FAILURE;
        } finally {
            unset($password, $confirmation);
        }
        $this->info('Administrador creado correctamente. La operación quedó auditada.');

        return self::SUCCESS;
    }
}
