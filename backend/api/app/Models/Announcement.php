<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Tabla heredada con id UUID; la audiencia v1 vive en announcement_audiences. */
class Announcement extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'title', 'body', 'audience', 'status', 'priority', 'link_url', 'link_label',
        'starts_at', 'duration_days', 'ends_at', 'created_by', 'updated_by'];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }
}
