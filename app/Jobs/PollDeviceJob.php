<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\AlertRule;
use App\Models\Device;
use App\Models\DeviceInterface;
use App\Models\DeviceMetric;
use App\Services\DemoSnmpService;
use App\Services\SnmpService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PollDeviceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 30;
    public $tries = 2;

    public function __construct(public Device $device) {}

    public function handle(): void
    {
        // Gunakan DemoSnmpService jika mode demo, SnmpService jika perangkat nyata
        $snmp = $this->device->is_demo
            ? new DemoSnmpService($this->device)
            : new SnmpService($this->device);
        $now  = Carbon::now();

        // Test connection first
        $test = $snmp->testConnection();

        if (!$test['success']) {
            $this->device->update(['status' => 'offline', 'last_polled_at' => $now]);
            $this->triggerInterfaceDownAlert($this->device, 'Device unreachable', 'offline');
            return;
        }

        $this->device->update(['status' => 'online', 'last_polled_at' => $now]);

        // System Info
        try {
            $sysInfo = $snmp->getSystemInfo();
            if ($sysInfo) {
                $this->device->update(['system_info' => array_merge(
                    $this->device->system_info ?? [],
                    $sysInfo
                )]);
            }
        } catch (\Exception $e) {
            Log::warning("System info poll failed: " . $e->getMessage());
        }

        // CPU Load
        try {
            $cpu = $snmp->getCpuLoad();
            if ($cpu !== null) {
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'cpu_load',
                    'value'       => $cpu,
                    'unit'        => '%',
                    'recorded_at' => $now,
                ]);
                $this->checkThreshold($this->device, 'cpu_load', $cpu, null, $now);
            }
        } catch (\Exception $e) {
            Log::warning("CPU poll failed: " . $e->getMessage());
        }

        // Memory
        try {
            $mem = $snmp->getMemoryInfo();
            if (!empty($mem)) {
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'memory_used',
                    'value'       => $mem['used_mb'] ?? 0,
                    'unit'        => 'MB',
                    'recorded_at' => $now,
                ]);
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'memory_total',
                    'value'       => $mem['total_mb'] ?? 0,
                    'unit'        => 'MB',
                    'recorded_at' => $now,
                ]);
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'memory_percent',
                    'value'       => $mem['percent'] ?? 0,
                    'unit'        => '%',
                    'recorded_at' => $now,
                ]);
                $this->checkThreshold($this->device, 'memory_percent', $mem['percent'] ?? 0, null, $now);
            }
        } catch (\Exception $e) {
            Log::warning("Memory poll failed: " . $e->getMessage());
        }

        // Disk
        try {
            $disk = $snmp->getDiskInfo();
            if (!empty($disk)) {
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'disk_used',
                    'value'       => $disk['used_mb'] ?? 0,
                    'unit'        => 'MB',
                    'recorded_at' => $now,
                ]);
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'disk_total',
                    'value'       => $disk['total_mb'] ?? 0,
                    'unit'        => 'MB',
                    'recorded_at' => $now,
                ]);
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'disk_percent',
                    'value'       => $disk['percent'] ?? 0,
                    'unit'        => '%',
                    'recorded_at' => $now,
                ]);
                $this->checkThreshold($this->device, 'disk_percent', $disk['percent'] ?? 0, null, $now);
            }
        } catch (\Exception $e) {
            Log::warning("Disk poll failed: " . $e->getMessage());
        }

        // Temperature & Voltage (via RouterOS 7 health table)
        try {
            $temp = $snmp->getTemperature();
            if ($temp !== null) {
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'temperature',
                    'value'       => $temp,
                    'unit'        => '°C',
                    'recorded_at' => $now,
                ]);
                $this->checkThreshold($this->device, 'temperature', $temp, null, $now);
            }

            $voltage = $snmp->getVoltage();
            if ($voltage !== null) {
                DeviceMetric::create([
                    'device_id'   => $this->device->id,
                    'metric_type' => 'voltage',
                    'value'       => $voltage,
                    'unit'        => 'V',
                    'recorded_at' => $now,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning("Temperature/Voltage poll failed: " . $e->getMessage());
        }

        // Interfaces & Traffic
        try {
            $interfaces = $snmp->getInterfaces();
            foreach ($interfaces as $iface) {
                // ── Step 1: read EXISTING record to capture previous counters & timestamp ──
                $existing = DeviceInterface::where('device_id', $this->device->id)
                    ->where('if_index', $iface['if_index'])
                    ->first();

                $prevIn   = $existing?->in_octets       ?? 0;
                $prevOut  = $existing?->out_octets      ?? 0;
                $prevTime = $existing?->last_updated_at ?? null;

                // ── Step 2: upsert status fields (NOT last_updated_at yet) ──
                $dbInterface = DeviceInterface::updateOrCreate(
                    ['device_id' => $this->device->id, 'if_index' => $iface['if_index']],
                    [
                        'if_name'         => $iface['if_name'],
                        'if_desc'         => $iface['if_desc'],
                        'if_speed'        => $iface['if_speed'],
                        'if_admin_status' => $iface['if_admin_status'],
                        'if_oper_status'  => $iface['if_oper_status'],
                        'if_phys_address' => $iface['if_phys_address'],
                    ]
                );

                // ── Step 3: calculate bandwidth using the OLD timestamp ──
                $newIn  = $iface['in_octets'];
                $newOut = $iface['out_octets'];

                if ($prevTime && $prevIn > 0 && $newIn >= $prevIn) {
                    $elapsed = max(1, $now->diffInSeconds($prevTime));
                    $inBps   = (($newIn  - $prevIn)  * 8) / $elapsed;
                    $outBps  = (($newOut - $prevOut) * 8) / $elapsed;

                    // Cap at interface speed (prevent garbage on counter reset / first poll)
                    $ifSpeedBps = max(1, $iface['if_speed']); // already in bps
                    $inBps  = min($inBps,  $ifSpeedBps);
                    $outBps = min($outBps, $ifSpeedBps);

                    $inMbps  = round($inBps  / 1_000_000, 4);
                    $outMbps = round($outBps / 1_000_000, 4);

                    DeviceMetric::create([
                        'device_id'      => $this->device->id,
                        'metric_type'    => 'if_in_bps',
                        'interface_name' => $iface['if_name'],
                        'value'          => $inMbps,
                        'unit'           => 'Mbps',
                        'recorded_at'    => $now,
                    ]);

                    DeviceMetric::create([
                        'device_id'      => $this->device->id,
                        'metric_type'    => 'if_out_bps',
                        'interface_name' => $iface['if_name'],
                        'value'          => $outMbps,
                        'unit'           => 'Mbps',
                        'recorded_at'    => $now,
                    ]);
                }

                // ── Step 4: update octet counters + timestamp AFTER calculation ──
                $dbInterface->update([
                    'in_octets'       => $newIn,
                    'out_octets'      => $newOut,
                    'in_errors'       => $iface['in_errors'],
                    'out_errors'      => $iface['out_errors'],
                    'last_updated_at' => $now,
                ]);

                // Alert if interface is down
                if ($iface['if_admin_status'] === 'up' && $iface['if_oper_status'] !== 'up') {
                    $this->triggerInterfaceDownAlert($this->device, $iface['if_name'], $iface['if_oper_status']);
                }
            }
        } catch (\Exception $e) {
            Log::warning("Interface poll failed: " . $e->getMessage());
        }

        // Clean up old metrics (keep 7 days)
        DeviceMetric::where('device_id', $this->device->id)
            ->where('recorded_at', '<', Carbon::now()->subDays(7))
            ->delete();

        Log::info("Device {$this->device->name} polled successfully at {$now}");
    }

    private function checkThreshold(Device $device, string $metricType, float $value, ?string $ifName, Carbon $now): void
    {
        $rules = AlertRule::where('device_id', $device->id)
            ->where('metric_type', $metricType)
            ->where('is_active', true)
            ->when($ifName, fn($q) => $q->where('interface_name', $ifName))
            ->get();

        foreach ($rules as $rule) {
            $triggered = match ($rule->condition) {
                'gt' => $value > $rule->threshold_value,
                'lt' => $value < $rule->threshold_value,
                'eq' => $value == $rule->threshold_value,
                default => false,
            };

            if ($triggered) {
                Alert::create([
                    'device_id'       => $device->id,
                    'metric_type'     => $metricType,
                    'interface_name'  => $ifName,
                    'severity'        => $rule->severity,
                    'threshold_value' => $rule->threshold_value,
                    'actual_value'    => $value,
                    'message'         => "[$rule->severity] {$metricType} = {$value} (threshold: {$rule->condition} {$rule->threshold_value})",
                    'triggered_at'    => $now,
                ]);
            }
        }
    }

    private function triggerInterfaceDownAlert(Device $device, string $ifName, string $status): void
    {
        // Only create alert if no unresolved one exists for this interface
        $existing = Alert::where('device_id', $device->id)
            ->where('metric_type', 'interface_down')
            ->where('interface_name', $ifName)
            ->where('is_resolved', false)
            ->exists();

        if (!$existing) {
            Alert::create([
                'device_id'      => $device->id,
                'metric_type'    => 'interface_down',
                'interface_name' => $ifName,
                'severity'       => 'critical',
                'message'        => "Interface {$ifName} is {$status}",
                'triggered_at'   => Carbon::now(),
            ]);
        }
    }
}
