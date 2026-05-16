<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ip_address',
        'snmp_community',
        'snmp_version',
        'snmp_port',
        'description',
        'location',
        'status',
        'polling_interval',
        'last_polled_at',
        'system_info',
        'is_active',
        'is_demo',
    ];

    protected $casts = [
        'system_info' => 'array',
        'last_polled_at' => 'datetime',
        'is_active' => 'boolean',
        'is_demo'   => 'boolean',
    ];

    public function metrics()
    {
        return $this->hasMany(DeviceMetric::class);
    }

    public function interfaces()
    {
        return $this->hasMany(DeviceInterface::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }

    public function alertRules()
    {
        return $this->hasMany(AlertRule::class);
    }

    public function latestMetric($type, $interface = null)
    {
        return $this->metrics()
            ->where('metric_type', $type)
            ->when($interface, fn($q) => $q->where('interface_name', $interface))
            ->latest('recorded_at')
            ->first();
    }

    public function isOnline(): bool
    {
        return $this->status === 'online';
    }

    public function getUptimeFormattedAttribute(): string
    {
        $info = $this->system_info ?? [];
        $seconds = $info['uptime_seconds'] ?? 0;

        if (!$seconds) return 'N/A';

        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        if ($days > 0) return "{$days}d {$hours}h {$minutes}m";
        if ($hours > 0) return "{$hours}h {$minutes}m";
        return "{$minutes}m";
    }
}
