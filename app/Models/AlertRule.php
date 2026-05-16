<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlertRule extends Model
{
    protected $fillable = [
        'device_id',
        'metric_type',
        'interface_name',
        'condition',
        'threshold_value',
        'severity',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'threshold_value' => 'decimal:2',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
