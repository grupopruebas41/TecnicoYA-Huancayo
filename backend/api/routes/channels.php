<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;

// Canales privados del Sprint 4 (contrato §2 y §8; SEC-S04-02). POST /api/v1/broadcasting/auth con la sesión de
// Sanctum; un técnico suspendido no se suscribe a ninguno (D-32). Los eventos solo llevan identificadores.

$suspended = fn (User $user) => DB::table('technician_profiles')->where('user_id', $user->id)->where('status', 'suspended')->exists();

// Solo el cliente titular; el técnico notificado usa su propio canal.
Broadcast::channel('requests.{requestId}', fn (User $user, int $requestId) => DB::table('service_requests as r')
    ->join('client_profiles as c', 'c.id', '=', 'r.client_id')->where('r.id', $requestId)->where('c.user_id', $user->id)->exists());

Broadcast::channel('technicians.{technicianId}', fn (User $user, int $technicianId) => DB::table('technician_profiles')
    ->where('id', $technicianId)->where('user_id', $user->id)->where('status', '<>', 'suspended')->exists());

Broadcast::channel('users.{userId}', fn (User $user, int $userId) => $user->id === $userId && ! $suspended($user));
