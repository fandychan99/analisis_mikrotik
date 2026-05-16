<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\AlertRule;
use App\Models\Device;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertController extends Controller
{
    public function index()
    {
        $device = Device::where('is_active', true)->first();

        $alerts = Alert::with('device')
            ->when($device, fn($q) => $q->where('device_id', $device->id))
            ->orderByDesc('triggered_at')
            ->paginate(20);

        $rules = $device ? AlertRule::where('device_id', $device->id)->get() : collect();

        return Inertia::render('Alerts/Index', [
            'alerts'          => $alerts,
            'rules'           => $rules,
            'device'          => $device,
            'unresolved_count' => $device ? Alert::where('device_id', $device->id)->where('is_resolved', false)->count() : 0,
        ]);
    }

    public function resolve(Alert $alert)
    {
        $alert->update([
            'is_resolved' => true,
            'resolved_at' => now(),
        ]);

        return back()->with('success', 'Alert diselesaikan.');
    }

    public function resolveAll(Request $request)
    {
        $device = Device::where('is_active', true)->first();
        if ($device) {
            Alert::where('device_id', $device->id)
                ->where('is_resolved', false)
                ->update(['is_resolved' => true, 'resolved_at' => now()]);
        }

        return back()->with('success', 'Semua alert diselesaikan.');
    }

    public function storeRule(Request $request)
    {
        $device = Device::where('is_active', true)->firstOrFail();

        $validated = $request->validate([
            'metric_type'     => 'required|string',
            'interface_name'  => 'nullable|string',
            'condition'       => 'required|in:gt,lt,eq',
            'threshold_value' => 'required|numeric',
            'severity'        => 'required|in:info,warning,critical',
        ]);

        AlertRule::create(array_merge($validated, ['device_id' => $device->id]));

        return back()->with('success', 'Aturan alert ditambahkan.');
    }

    public function destroyRule(AlertRule $alertRule)
    {
        $alertRule->delete();
        return back()->with('success', 'Aturan alert dihapus.');
    }
}
