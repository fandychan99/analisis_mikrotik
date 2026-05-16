<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceMetric;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $device = Device::where('is_active', true)->first();

        $period = request('period', '24h');

        $startTime = match ($period) {
            '1h'    => now()->subHour(),
            '6h'    => now()->subHours(6),
            '24h'   => now()->subDay(),
            '7d'    => now()->subDays(7),
            default => now()->subDay(),
        };

        $cpuStats    = null;
        $memStats    = null;
        $diskStats   = null;
        $cpuHistory  = [];
        $memHistory  = [];
        $diskHistory = [];

        if ($device) {
            // CPU stats
            $cpuData = DeviceMetric::where('device_id', $device->id)
                ->where('metric_type', 'cpu_load')
                ->where('recorded_at', '>=', $startTime)
                ->orderBy('recorded_at')
                ->get(['value', 'recorded_at']);

            if ($cpuData->isNotEmpty()) {
                $cpuStats = [
                    'avg' => round($cpuData->avg('value'), 2),
                    'max' => round($cpuData->max('value'), 2),
                    'min' => round($cpuData->min('value'), 2),
                    'current' => round($cpuData->last()->value, 2),
                ];
                $cpuHistory = $cpuData->map(fn($m) => [
                    'time'  => $m->recorded_at->format($period === '7d' ? 'M d H:i' : 'H:i'),
                    'value' => round($m->value, 1),
                ])->values()->toArray();
            }

            // Memory stats
            $memData = DeviceMetric::where('device_id', $device->id)
                ->where('metric_type', 'memory_percent')
                ->where('recorded_at', '>=', $startTime)
                ->orderBy('recorded_at')
                ->get(['value', 'recorded_at']);

            if ($memData->isNotEmpty()) {
                $memStats = [
                    'avg' => round($memData->avg('value'), 2),
                    'max' => round($memData->max('value'), 2),
                    'min' => round($memData->min('value'), 2),
                    'current' => round($memData->last()->value, 2),
                ];
                $memHistory = $memData->map(fn($m) => [
                    'time'  => $m->recorded_at->format($period === '7d' ? 'M d H:i' : 'H:i'),
                    'value' => round($m->value, 1),
                ])->values()->toArray();
            }

            // Disk stats
            $diskData = DeviceMetric::where('device_id', $device->id)
                ->where('metric_type', 'disk_percent')
                ->where('recorded_at', '>=', $startTime)
                ->orderBy('recorded_at')
                ->get(['value', 'recorded_at']);

            if ($diskData->isNotEmpty()) {
                $diskStats = [
                    'avg' => round($diskData->avg('value'), 2),
                    'max' => round($diskData->max('value'), 2),
                    'min' => round($diskData->min('value'), 2),
                    'current' => round($diskData->last()->value, 2),
                ];
                $diskHistory = $diskData->map(fn($m) => [
                    'time'  => $m->recorded_at->format($period === '7d' ? 'M d H:i' : 'H:i'),
                    'value' => round($m->value, 1),
                ])->values()->toArray();
            }
        }

        return Inertia::render('Reports/Index', [
            'device'       => $device,
            'period'       => $period,
            'cpu_stats'    => $cpuStats,
            'mem_stats'    => $memStats,
            'disk_stats'   => $diskStats,
            'cpu_history'  => $cpuHistory,
            'mem_history'  => $memHistory,
            'disk_history' => $diskHistory,
        ]);
    }

    public function export(Request $request)
    {
        $device = Device::where('is_active', true)->firstOrFail();

        $period = $request->get('period', '24h');
        $startTime = match ($period) {
            '1h'  => now()->subHour(),
            '6h'  => now()->subHours(6),
            '24h' => now()->subDay(),
            '7d'  => now()->subDays(7),
            default => now()->subDay(),
        };

        $metrics = DeviceMetric::where('device_id', $device->id)
            ->where('recorded_at', '>=', $startTime)
            ->orderBy('recorded_at')
            ->get();

        $csv = "Waktu,Tipe Metrik,Interface,Nilai,Satuan\n";
        foreach ($metrics as $m) {
            $csv .= implode(',', [
                $m->recorded_at->format('Y-m-d H:i:s'),
                $m->metric_type,
                $m->interface_name ?? '-',
                $m->value,
                $m->unit ?? '-',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"laporan_{$period}_{$device->name}.csv\"",
        ]);
    }
}
