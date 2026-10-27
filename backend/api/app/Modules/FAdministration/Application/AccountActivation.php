<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * D-85: correo con el enlace para activar una cuenta que dio de alta un administrador. La persona define su propia
 * contraseña en la SPA (`#cuenta/activar`); el token es del broker `activations` (72 horas, un solo uso, con hash).
 */
final class AccountActivation extends Notification
{
    public function __construct(public readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public static function url(object $notifiable, string $token): string
    {
        return rtrim((string) config('security.spa_url'), '/').'/#cuenta/activar?token='.urlencode($token)
            .'&email='.urlencode($notifiable->getEmailForPasswordReset());
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Activa tu cuenta de TécnicoYa')
            ->greeting('Hola:')
            ->line('El equipo de TécnicoYa creó una cuenta con este correo.')
            ->action('Activar mi cuenta', self::url($notifiable, $this->token))
            ->line('Al abrir el enlace eliges tu contraseña. Vence en 72 horas y solo se puede usar una vez.')
            ->line('Si no esperabas este correo, ignóralo: nadie podrá entrar sin activar la cuenta.')
            ->salutation('Equipo TécnicoYa');
    }
}
