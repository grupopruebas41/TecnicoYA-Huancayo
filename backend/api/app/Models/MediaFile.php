<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaFile extends Model
{
    protected $fillable = ['owner_id', 'disk', 'storage_key', 'original_name', 'mime_type', 'byte_size', 'sha256', 'visibility', 'scan_status'];

    protected $hidden = ['storage_key', 'disk', 'sha256'];

    protected function casts(): array
    {
        return ['retired_at' => 'datetime', 'byte_size' => 'integer'];
    }
}
