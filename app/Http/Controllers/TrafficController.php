<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceMetric;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrafficController extends Controller
{
    public function index()
    {
        $device = Device::where('is_active', true)->first();
        $interfaces = $device ? $device->interfaces()->where('if_oper_status', 'up')->get() : collect();

        $defaultInterface = $interfaces->first()?->if_name;

        $trafficData = [];
        if ($device && $defaultInterface) {
            $trafficData = $this->getTrafficData($device->id, $defaultInterface, 1);
        }

        return Inertia::render('Traffic/Index', [
            'device'     => $device,
            'interfaces' => $interfaces->map(fn($i) => [
                'id'       => $i->id,
                'name'     => $i->if_name,
                'desc'     => $i->if_desc,
                'speed'    => $i->speed_formatted,
                'status'   => $i->if_oper_status,
                'bytes_rx' => $i->in_octets  ?? 0,
                'bytes_tx' => $i->out_octets ?? 0,
            ]),
            'traffic_data'       => $trafficData,
            'selected_interface' => $defaultInterface,
        ]);
    }

    public function data(Request $request)
    {
        $device = Device::where('is_active', true)->first();
        if (!$device) return response()->json(['error' => 'No device']);

        $ifName = $request->get('interface');
        $hours  = max(1, min(24, (int) $request->get('hours', 1)));

        $data = $this->getTrafficData($device->id, $ifName, $hours);

        // Stats
        $inValues  = array_column($data, 'in');
        $outValues = array_column($data, 'out');

        // Bytes totals dari interface record terbaru
        $iface = $device->interfaces()->where('if_name', $ifName)->first();

        return response()->json([
            'data' => $data,
            'stats' => [
                'in_current'  => count($inValues)  > 0 ? round(end($inValues),  1) : 0,
                'out_current' => count($outValues) > 0 ? round(end($outValues), 1) : 0,
                'in_avg'      => count($inValues)  > 0 ? round(array_sum($inValues)  / count($inValues),  1) : 0,
                'out_avg'     => count($outValues) > 0 ? round(array_sum($outValues) / count($outValues), 1) : 0,
                'in_max'      => count($inValues)  > 0 ? round(max($inValues),  1) : 0,
                'out_max'     => count($outValues) > 0 ? round(max($outValues), 1) : 0,
                'in_min'      => count($inValues)  > 0 ? round(min($inValues),  1) : 0,
                'out_min'     => count($outValues) > 0 ? round(min($outValues), 1) : 0,
                'bytes_rx'    => $iface?->in_octets  ?? 0,
                'bytes_tx'    => $iface?->out_octets ?? 0,
            ],
        ]);
    }

    private function getTrafficData(int $deviceId, ?string $ifName, int $hours): array
    {
        if (!$ifName) return [];

        $inData = DeviceMetric::where('device_id', $deviceId)
            ->where('metric_type', 'if_in_bps')
            ->where('interface_name', $ifName)
            ->where('recorded_at', '>=', now()->subHours($hours))
            ->orderBy('recorded_at')
            ->get(['value', 'recorded_at'])
            ->keyBy(fn($m) => $m->recorded_at->format('Y-m-d H:i:s'));

        $outData = DeviceMetric::where('device_id', $deviceId)
            ->where('metric_type', 'if_out_bps')
            ->where('interface_name', $ifName)
            ->where('recorded_at', '>=', now()->subHours($hours))
            ->orderBy('recorded_at')
            ->get(['value', 'recorded_at'])
            ->keyBy(fn($m) => $m->recorded_at->format('Y-m-d H:i:s'));

        $times = $inData->keys()->merge($outData->keys())->unique()->sort()->values();

        return $times->map(fn($t) => [
            'time' => substr($t, 11, 8), // HH:MM:SS
            'in'   => round($inData[$t]->value  ?? 0, 1),
            'out'  => round($outData[$t]->value ?? 0, 1),
        ])->values()->toArray();
    }
}
