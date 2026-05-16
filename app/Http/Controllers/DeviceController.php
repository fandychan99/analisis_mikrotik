<?php

namespace App\Http\Controllers;

use App\Jobs\PollDeviceJob;
use App\Models\Device;
use App\Services\DemoSnmpService;
use App\Services\SnmpService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeviceController extends Controller
{
    public function index()
    {
        $device = Device::with(['interfaces', 'alerts' => fn($q) => $q->where('is_resolved', false)])
            ->where('is_active', true)
            ->first();

        return Inertia::render('Devices/Index', [
            'device' => $device ? array_merge($device->toArray(), [
                'uptime_formatted' => $device->uptime_formatted,
            ]) : null,
        ]);
    }

    public function store(Request $request)
    {
        $isDemo = (bool) $request->input('is_demo', false);

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'ip_address'       => $isDemo ? 'nullable' : 'required|ip',
            'snmp_community'   => $isDemo ? 'nullable' : 'required|string|max:100',
            'snmp_version'     => 'required|in:1,2c,3',
            'snmp_port'        => 'nullable|integer|min:1|max:65535',
            'description'      => 'nullable|string|max:500',
            'location'         => 'nullable|string|max:255',
            'polling_interval' => 'nullable|integer|min:10|max:3600',
            'is_demo'          => 'nullable|boolean',
        ]);

        // Deactivate previous device (single device mode)
        Device::query()->update(['is_active' => false]);

        $device = Device::create([
            'name'             => $validated['name'],
            'ip_address'       => $isDemo ? '127.0.0.1' : ($validated['ip_address'] ?? '127.0.0.1'),
            'snmp_community'   => $isDemo ? 'demo' : ($validated['snmp_community'] ?? 'public'),
            'snmp_version'     => $validated['snmp_version'],
            'snmp_port'        => $validated['snmp_port'] ?? 161,
            'description'      => $validated['description'] ?? null,
            'location'         => $validated['location'] ?? null,
            'polling_interval' => $validated['polling_interval'] ?? 30,
            'is_active'        => true,
            'is_demo'          => $isDemo,
            'status'           => $isDemo ? 'online' : 'unknown',
            'system_info'      => $isDemo ? [
                'sys_name'       => 'MikroTik-Demo-RB4011',
                'sys_descr'      => 'RouterOS v7.14.3 (MikroTik) — DEMO MODE',
                'sys_location'   => 'Server Room - Demo',
                'uptime_seconds' => 86400,
            ] : null,
        ]);

        // Trigger initial poll
        PollDeviceJob::dispatch($device);

        $msg = $isDemo
            ? 'Mode Demo diaktifkan! Data simulasi sedang dibuat...'
            : 'Perangkat berhasil ditambahkan. Polling dimulai...';

        return redirect()->route('devices.index')->with('success', $msg);
    }

    public function update(Request $request, Device $device)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'ip_address'       => 'nullable|ip',
            'snmp_community'   => 'nullable|string|max:100',
            'snmp_version'     => 'required|in:1,2c,3',
            'snmp_port'        => 'nullable|integer|min:1|max:65535',
            'description'      => 'nullable|string|max:500',
            'location'         => 'nullable|string|max:255',
            'polling_interval' => 'nullable|integer|min:10|max:3600',
        ]);

        $device->update($validated);
        PollDeviceJob::dispatch($device);

        return redirect()->route('devices.index')->with('success', 'Perangkat berhasil diperbarui.');
    }

    public function destroy(Device $device)
    {
        $device->delete();
        return redirect()->route('devices.index')->with('success', 'Perangkat berhasil dihapus.');
    }

    public function testConnection(Request $request)
    {
        // Jika demo mode, tidak perlu test SNMP sungguhan
        if ($request->boolean('is_demo')) {
            return response()->json([
                'success'  => true,
                'message'  => 'Mode Demo aktif — tidak memerlukan perangkat fisik',
                'sysname'  => 'MikroTik-Demo-RB4011',
                'sys_info' => [
                    'sys_name'    => 'MikroTik-Demo-RB4011',
                    'sys_descr'   => 'RouterOS v7.14.3 (MikroTik) — DEMO MODE',
                    'sys_location' => 'Server Room - Demo',
                ],
            ]);
        }

        $request->validate([
            'ip_address'     => 'required|ip',
            'snmp_community' => 'required|string',
            'snmp_version'   => 'required|in:1,2c,3',
            'snmp_port'      => 'nullable|integer',
        ]);

        // Create a temporary device object for testing
        $tempDevice = new Device([
            'ip_address'     => $request->ip_address,
            'snmp_community' => $request->snmp_community,
            'snmp_version'   => $request->snmp_version,
            'snmp_port'      => $request->snmp_port ?? 161,
            'is_demo'        => false,
        ]);

        $snmp   = new SnmpService($tempDevice);
        $result = $snmp->testConnection();

        if ($result['success']) {
            $sysInfo = $snmp->getSystemInfo();
            $result['sys_info'] = $sysInfo;
        }

        return response()->json($result);
    }

    public function poll(Device $device)
    {
        PollDeviceJob::dispatch($device);
        return response()->json(['message' => 'Polling started']);
    }
}
