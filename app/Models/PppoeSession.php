<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PppoeSession extends Model
{
    protected $table = 'pppoe_sessions';

    protected $fillable = [
        'device_id',
        'username',
        'interface_name',
        'caller_id',
        'service',
        'state',
        'uptime_seconds',
        'rx_bytes',
        'tx_bytes',
        'last_seen_at',
    ];

    protected $casts = [
        'uptime_seconds' => 'integer',
        'rx_bytes'       => 'integer',
        'tx_bytes'       => 'integer',
        'last_seen_at'   => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function getRxFormattedAttribute(): string
    {
        return $this->formatBytes($this->rx_bytes);
    }

    public function getTxFormattedAttribute(): string
    {
        return $this->formatBytes($this->tx_bytes);
    }

    public function getUptimeFormattedAttribute(): string
    {
        $s = $this->uptime_seconds;
        if ($s <= 0) return '—';
        $d = intdiv($s, 86400);
        $h = intdiv($s % 86400, 3600);
        $m = intdiv($s % 3600, 60);
        $parts = [];
        if ($d) $parts[] = "{$d}d";
        if ($h) $parts[] = "{$h}h";
        $parts[] = "{$m}m";
        return implode(' ', $parts);
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1_099_511_627_776) return round($bytes / 1_099_511_627_776, 1) . ' TB';
        if ($bytes >= 1_073_741_824)     return round($bytes / 1_073_741_824, 1) . ' GB';
        if ($bytes >= 1_048_576)         return round($bytes / 1_048_576, 1) . ' MB';
        if ($bytes >= 1_024)             return round($bytes / 1_024, 1) . ' KB';
        return $bytes . ' B';
    }
}
