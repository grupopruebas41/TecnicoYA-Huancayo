<?php

namespace App\Modules\CNotifications\Application;

/** Canal externo de entrega de una notificación de la bandeja. Lanza una excepción si la entrega falla. */
interface DeliveryChannel
{
    public function send(object $notification): void;
}
