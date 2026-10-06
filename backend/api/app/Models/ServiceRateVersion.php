<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Versión inmutable de una tarifa referencial: solo tiene created_at. */
class ServiceRateVersion extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['technician_service_id', 'version_no', 'reference_fee', 'currency', 'changed_by', 'reason', 'effective_from'];
}
