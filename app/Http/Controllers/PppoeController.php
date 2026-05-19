<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\PppoeSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * [A — Accounting Management] FCAPS
 * PPPoE session tracking: username, IP, uptime, Rx/Tx bytes
 */
class PppoeController extends Controller
{
    public function index(Request $request)
    {
        $device = Device::where('is_active', true)->first();

        $sessions = [];
        $summary  = ['total' => 0, 'active' => 0, 'disconnected' => 0, 'total_rx' => 0, 'total_tx' => 0];

        if ($device) {
            $query = PppoeSession::where('device_id', $device->id)
                ->orderBy('state')
                ->orderByDesc('last_seen_at');

            if ($request->filled('search')) {
                $q = $request->search;
                $query->where(fn($q2) => $q2
                    ->where('username', 'like', "%{$q}%")
                    ->orWhere('caller_id', 'like', "%{$q}%")
                    ->orWhere('service', 'like', "%{$q}%")
                );
            }

            $rawSessions = PppoeSession::where('device_id', $device->id)->get();
            $summary = [
                'total'        => $rawSessions->count(),
                'active'       => $rawSessions->where('state', 'active')->count(),
                'disconnected' => $rawSessions->where('state', 'disconnected')->count(),
                'total_rx'     => $rawSessions->sum('rx_bytes'),
                'total_tx'     => $rawSessions->sum('tx_bytes'),
            ];

            $sessions = $query->get()->map(fn($s) => [
                'id'               => $s->id,
                'username'         => $s->username,
                'interface_name'   => $s->interface_name,
                'caller_id'        => $s->caller_id,
                'service'          => $s->service,
                'state'            => $s->state,
                'uptime_seconds'   => $s->uptime_seconds,
                'uptime_formatted' => $s->uptime_formatted,
                'rx_bytes'         => $s->rx_bytes,
                'tx_bytes'         => $s->tx_bytes,
                'rx_formatted'     => $s->rx_formatted,
                'tx_formatted'     => $s->tx_formatted,
                'last_seen_at'     => $s->last_seen_at?->diffForHumans(),
            ])->toArray();
        }

        return Inertia::render('Pppoe/Index', [
            'device'   => $device,
            'sessions' => $sessions,
            'summary'  => $summary,
            'search'   => $request->search ?? '',
        ]);
    }
}
