<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $attributes = ['is_active' => true, 'version' => 1, 'auth_version' => 1];

    // role se conserva solo para las rutas históricas; v1 asigna role_id desde el servicio.
    protected $fillable = ['name', 'email', 'password', 'role'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'is_active' => 'boolean', 'version' => 'integer', 'auth_version' => 'integer'];
    }
}
