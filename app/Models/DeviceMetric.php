<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceMetric extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'device_id',
        'metric_type',
        'interface_name',
        'value',
        'unit',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'value' => 'decimal:4',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
