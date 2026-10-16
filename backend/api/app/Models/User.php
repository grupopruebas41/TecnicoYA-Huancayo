<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $attributes = ['is_active' => true, 'version' => 1, 'auth_version' => 1];

    // role es la columna heredada (AuthorizationSeeder la usa para completar role_id); v1 asigna role_id.
    protected $fillable = ['name', 'email', 'password', 'role'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'is_active' => 'boolean', 'version' => 'integer', 'auth_version' => 'integer'];
    }
}
