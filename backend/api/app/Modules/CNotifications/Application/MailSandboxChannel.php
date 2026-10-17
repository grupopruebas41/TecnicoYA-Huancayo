<?php

namespace App\Modules\CNotifications\Application;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Canal de S4: correo de sandbox con el mailer por defecto (`log` en desarrollo, `array` en pruebas). La bandeja
 * interna nunca depende de que el correo salga (D-21).
 */
final class MailSandboxChannel implements DeliveryChannel
{
    public function send(object $notification): void
    {
        $email = DB::table('users')->where('id', $notification->user_id)->value('email');
        Mail::raw($notification->body, fn ($message) => $message->to($email)->subject($notification->title));
    }
}
