<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * D-80: enlace de la SPA (`#cuenta/restablecer`) y correo en español del restablecimiento. El token es aleatorio,
 * de un solo uso, se guarda con hash en password_reset_tokens y vence a los 60 minutos (config/auth.php).
 */
final class PasswordResetLink
{
    public static function url(CanResetPassword $user, string $token): string
    {
        return rtrim((string) config('security.spa_url'), '/').'/#cuenta/restablecer?token='.urlencode($token)
            .'&email='.urlencode($user->getEmailForPasswordReset());
    }

    public static function mail(CanResetPassword $user, string $token): MailMessage
    {
        return (new MailMessage)
            ->subject('Restablece tu contraseña de TécnicoYa')
            ->greeting('Hola:')
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta.')
            ->action('Restablecer contraseña', self::url($user, $token))
            ->line('El enlace vence en 60 minutos y solo se puede usar una vez.')
            ->line('Si no lo pediste, ignora este correo: tu contraseña no cambia.')
            ->salutation('Equipo TécnicoYa');
    }
}
