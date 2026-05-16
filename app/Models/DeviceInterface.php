<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceInterface extends Model
{
    protected $table = 'device_interfaces';

    protected $fillable = [
        'device_id',
        'if_index',
        'if_name',
        'if_desc',
        'if_type',
        'if_speed',
        'if_oper_status',
        'if_admin_status',
        'if_phys_address',
        'in_octets',
        'out_octets',
        'in_errors',
        'out_errors',
        'last_updated_at',
    ];

    protected $casts = [
        'last_updated_at' => 'datetime',
        'in_octets' => 'integer',
        'out_octets' => 'integer',
        'if_speed' => 'integer',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function getSpeedFormattedAttribute(): string
    {
        $bps = $this->if_speed;
        if ($bps >= 1_000_000_000) return round($bps / 1_000_000_000, 1) . ' Gbps';
        if ($bps >= 1_000_000) return round($bps / 1_000_000, 1) . ' Mbps';
        if ($bps >= 1_000) return round($bps / 1_000, 1) . ' Kbps';
        return $bps . ' bps';
    }
}
