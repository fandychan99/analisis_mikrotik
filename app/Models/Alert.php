<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    protected $fillable = [
        'device_id',
        'metric_type',
        'interface_name',
        'severity',
        'threshold_value',
        'actual_value',
        'message',
        'is_resolved',
        'resolved_at',
        'triggered_at',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
        'triggered_at' => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
