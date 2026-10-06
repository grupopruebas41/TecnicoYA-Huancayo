<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequest extends Model
{
    protected $fillable = ['client_id', 'subcategory_id', 'district_id', 'description', 'address', 'mode',
        'preferred_start_at', 'preferred_end_at', 'source', 'target_technician_id', 'status',
        'reference_fee_snapshot', 'currency', 'version'];

    protected function casts(): array
    {
        return ['preferred_start_at' => 'datetime', 'preferred_end_at' => 'datetime', 'submitted_at' => 'datetime', 'version' => 'integer'];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }
}
