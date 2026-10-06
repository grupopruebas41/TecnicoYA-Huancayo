<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TechnicianProfile extends Model
{
    protected $fillable = ['user_id', 'display_name', 'bio', 'status', 'verification_status', 'experience_years', 'version'];

    protected function casts(): array
    {
        return ['verified_at' => 'datetime', 'version' => 'integer', 'experience_years' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(TechnicianService::class, 'technician_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(TechnicianDocument::class, 'technician_id');
    }
}
