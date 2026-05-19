<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceInterface;
use App\Models\DeviceMetric;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * [C — Configuration Management] FCAPS
 * Inventory perangkat: hardware info, interfaces, OS version
 */
class InventoryController extends Controller
{
    public function index()
    {
        $device = Device::where('is_active', true)->first();

        $interfaces = [];
        $systemInfo = null;

        if ($device) {
            $systemInfo = $device->system_info ?? [];

            $interfaces = $device->interfaces()
                ->orderBy('if_oper_status')
                ->orderBy('if_name')
                ->get()
                ->map(fn($i) => [
                    'id'            => $i->id,
                    'name'          => $i->if_name,
                    'desc'          => $i->if_desc,
                    'speed'         => $i->speed_formatted,
                    'mac'           => $i->if_phys_address,
                    'admin_status'  => $i->if_admin_status,
                    'oper_status'   => $i->if_oper_status,
                    'rx_bytes'      => $i->in_octets  ?? 0,
                    'tx_bytes'      => $i->out_octets ?? 0,
                    'in_errors'     => $i->in_errors  ?? 0,
                    'out_errors'    => $i->out_errors ?? 0,
                    'in_discards'   => $i->in_discards  ?? 0,
                    'out_discards'  => $i->out_discards ?? 0,
                    'last_updated'  => $i->last_updated_at?->diffForHumans(),
                ])
                ->toArray();
        }

        return Inertia::render('Inventory/Index', [
            'device'      => $device,
            'system_info' => $systemInfo,
            'interfaces'  => $interfaces,
        ]);
    }
}
