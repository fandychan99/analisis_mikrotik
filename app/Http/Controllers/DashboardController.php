<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Device;
use App\Models\DeviceMetric;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $device = Device::where('is_active', true)->first();

        $stats = [
            'device' => null,
            'current' => [
                'cpu'    => null,
                'memory_percent' => null,
                'memory_used_mb' => null,
                'memory_total_mb' => null,
                'disk_percent' => null,
                'disk_used_mb' => null,
                'disk_total_mb' => null,
                'temperature' => null,
                'uptime' => null,
            ],
            'interfaces_up'   => 0,
            'interfaces_down' => 0,
            'active_alerts'   => 0,
            'cpu_history'     => [],
            'memory_history'  => [],
            'traffic_history' => [],
        ];

        if ($device) {
            $stats['device'] = array_merge($device->toArray(), [
                'uptime_formatted' => $device->uptime_formatted,
            ]);

            // Latest metrics
            $latestCpu    = $device->latestMetric('cpu_load');
            $latestMemP   = $device->latestMetric('memory_percent');
            $latestMemU   = $device->latestMetric('memory_used');
            $latestMemT   = $device->latestMetric('memory_total');
            $latestDiskP  = $device->latestMetric('disk_percent');
            $latestDiskU  = $device->latestMetric('disk_used');
            $latestDiskT  = $device->latestMetric('disk_total');
            $latestTemp   = $device->latestMetric('temperature');

            $stats['current'] = [
                'cpu'             => $latestCpu ? round($latestCpu->value, 1) : null,
                'memory_percent'  => $latestMemP ? round($latestMemP->value, 1) : null,
                'memory_used_mb'  => $latestMemU ? round($latestMemU->value, 1) : null,
                'memory_total_mb' => $latestMemT ? round($latestMemT->value, 1) : null,
                'disk_percent'    => $latestDiskP ? round($latestDiskP->value, 1) : null,
                'disk_used_mb'    => $latestDiskU ? round($latestDiskU->value, 1) : null,
                'disk_total_mb'   => $latestDiskT ? round($latestDiskT->value, 1) : null,
                'temperature'     => $latestTemp ? round($latestTemp->value, 1) : null,
                'uptime'          => $device->uptime_formatted,
            ];

            // Interface counts
            $stats['interfaces_up']   = $device->interfaces()->where('if_oper_status', 'up')->count();
            $stats['interfaces_down'] = $device->interfaces()->where('if_oper_status', 'down')->count();

            // Active alerts
            $stats['active_alerts'] = Alert::where('device_id', $device->id)
                ->where('is_resolved', false)
                ->count();

            // CPU history (last 2 hours, 1 point per poll)
            $stats['cpu_history'] = DeviceMetric::where('device_id', $device->id)
                ->where('metric_type', 'cpu_load')
                ->where('recorded_at', '>=', now()->subHours(2))
                ->orderBy('recorded_at')
                ->get(['value', 'recorded_at'])
                ->map(fn($m) => [
                    'time'  => $m->recorded_at->format('H:i:s'),
                    'value' => round($m->value, 1),
                ])
                ->values()
                ->toArray();

            // Memory history
            $stats['memory_history'] = DeviceMetric::where('device_id', $device->id)
                ->where('metric_type', 'memory_percent')
                ->where('recorded_at', '>=', now()->subHours(2))
                ->orderBy('recorded_at')
                ->get(['value', 'recorded_at'])
                ->map(fn($m) => [
                    'time'  => $m->recorded_at->format('H:i:s'),
                    'value' => round($m->value, 1),
                ])
                ->values()
                ->toArray();

            // Traffic: get top interface with most traffic
            $topInterface = $device->interfaces()
                ->where('if_oper_status', 'up')
                ->orderByDesc('in_octets')
                ->first();

            if ($topInterface) {
                $inData = DeviceMetric::where('device_id', $device->id)
                    ->where('metric_type', 'if_in_bps')
                    ->where('interface_name', $topInterface->if_name)
                    ->where('recorded_at', '>=', now()->subHours(1))
                    ->orderBy('recorded_at')
                    ->get(['value', 'recorded_at', 'interface_name'])
                    ->keyBy(fn($m) => $m->recorded_at->format('H:i:s'));

                $outData = DeviceMetric::where('device_id', $device->id)
                    ->where('metric_type', 'if_out_bps')
                    ->where('interface_name', $topInterface->if_name)
                    ->where('recorded_at', '>=', now()->subHours(1))
                    ->orderBy('recorded_at')
                    ->get(['value', 'recorded_at'])
                    ->keyBy(fn($m) => $m->recorded_at->format('H:i:s'));

                $times = $inData->keys()->merge($outData->keys())->unique()->sort()->values();

                $stats['traffic_history'] = $times->map(fn($t) => [
                    'time' => $t,
                    'in'   => round($inData[$t]->value ?? 0, 4),
                    'out'  => round($outData[$t]->value ?? 0, 4),
                ])->values()->toArray();

                $stats['top_interface'] = $topInterface->if_name;
            }
        }

        return Inertia::render('Dashboard', $stats);
    }

    /**
     * API endpoint for live refresh
     */
    public function live()
    {
        $device = Device::where('is_active', true)->first();
        if (!$device) return response()->json(['error' => 'No device configured'], 404);

        $latestCpu   = $device->latestMetric('cpu_load');
        $latestMemP  = $device->latestMetric('memory_percent');
        $latestMemU  = $device->latestMetric('memory_used');
        $latestMemT  = $device->latestMetric('memory_total');
        $latestDiskP = $device->latestMetric('disk_percent');
        $latestTemp  = $device->latestMetric('temperature');

        return response()->json([
            'status'         => $device->status,
            'last_polled_at' => $device->last_polled_at?->diffForHumans(),
            'cpu'            => $latestCpu ? round($latestCpu->value, 1) : null,
            'memory_percent' => $latestMemP ? round($latestMemP->value, 1) : null,
            'memory_used_mb' => $latestMemU ? round($latestMemU->value, 1) : null,
            'memory_total_mb'=> $latestMemT ? round($latestMemT->value, 1) : null,
            'disk_percent'   => $latestDiskP ? round($latestDiskP->value, 1) : null,
            'temperature'    => $latestTemp ? round($latestTemp->value, 1) : null,
            'uptime'         => $device->uptime_formatted,
            'active_alerts'  => Alert::where('device_id', $device->id)->where('is_resolved', false)->count(),
            'cpu_point' => $latestCpu ? [
                'time'  => $latestCpu->recorded_at->format('H:i:s'),
                'value' => round($latestCpu->value, 1),
            ] : null,
            'memory_point' => $latestMemP ? [
                'time'  => $latestMemP->recorded_at->format('H:i:s'),
                'value' => round($latestMemP->value, 1),
            ] : null,
        ]);
    }
}
