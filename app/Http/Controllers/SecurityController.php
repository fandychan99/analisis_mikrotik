<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * [S — Security Management] FCAPS
 * Dashboard keamanan: audit log, login history, statistik ancaman
 */
class SecurityController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', '24h');
        $startTime = match($period) {
            '1h'  => now()->subHour(),
            '6h'  => now()->subHours(6),
            '24h' => now()->subDay(),
            '7d'  => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subDay(),
        };

        // ── Login Statistics ──
        $loginStats = [
            'total'          => LoginLog::where('logged_at', '>=', $startTime)->count(),
            'success'        => LoginLog::where('logged_at', '>=', $startTime)->where('status', 'success')->count(),
            'failed'         => LoginLog::where('logged_at', '>=', $startTime)->where('status', 'failed')->count(),
            'unique_ips'     => LoginLog::where('logged_at', '>=', $startTime)->distinct('ip_address')->count('ip_address'),
            'blocked_ips'    => $this->getBlockedIps(),
        ];

        // ── Suspicious IPs (≥5 gagal dalam periode) ──
        $suspiciousIps = LoginLog::select('ip_address')
            ->selectRaw('COUNT(*) as attempt_count')
            ->selectRaw('MAX(logged_at) as last_attempt')
            ->where('status', 'failed')
            ->where('logged_at', '>=', $startTime)
            ->groupBy('ip_address')
            ->having('attempt_count', '>=', 3)
            ->orderByDesc('attempt_count')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'ip'           => $r->ip_address,
                'attempts'     => $r->attempt_count,
                'last_attempt' => \Carbon\Carbon::parse($r->last_attempt)->diffForHumans(),
                'is_blocked'   => $r->attempt_count >= 10,
            ])
            ->toArray();

        // ── Recent Login History ──
        $loginHistory = LoginLog::orderByDesc('logged_at')
            ->where('logged_at', '>=', $startTime)
            ->limit(50)
            ->get()
            ->map(fn($l) => [
                'id'             => $l->id,
                'email'          => $l->email,
                'ip_address'     => $l->ip_address,
                'browser'        => $l->browser,
                'platform'       => $l->platform,
                'status'         => $l->status,
                'failure_reason' => $l->failure_reason,
                'logged_at'      => $l->logged_at->diffForHumans(),
                'logged_at_full' => $l->logged_at->format('d M Y H:i:s'),
            ])
            ->toArray();

        // ── Activity Log (Audit Trail) ──
        $activityFilter = $request->get('action');
        $activityQuery = ActivityLog::with('user')
            ->where('performed_at', '>=', $startTime)
            ->orderByDesc('performed_at');

        if ($activityFilter) {
            $activityQuery->where('action', $activityFilter);
        }

        $activities = $activityQuery->limit(100)->get()->map(fn($a) => [
            'id'            => $a->id,
            'user_name'     => $a->user_name ?? 'Unknown',
            'action'        => $a->action,
            'action_label'  => ActivityLog::actionLabel($a->action),
            'subject_label' => $a->subject_label,
            'ip_address'    => $a->ip_address,
            'severity'      => $a->severity,
            'icon'          => ActivityLog::severityIcon($a->severity),
            'performed_at'  => $a->performed_at->diffForHumans(),
            'performed_full'=> $a->performed_at->format('d M Y H:i:s'),
        ])->toArray();

        // ── Security Score (0–100) ──
        $score = $this->calculateSecurityScore($loginStats);

        // ── Hourly Login Chart (24h only) ──
        $hourlyData = [];
        if ($period === '24h') {
            for ($h = 23; $h >= 0; $h--) {
                $hour = now()->subHours($h);
                $label = $hour->format('H:00');
                $success = LoginLog::where('logged_at', '>=', $hour->copy()->startOfHour())
                    ->where('logged_at', '<', $hour->copy()->endOfHour())
                    ->where('status', 'success')->count();
                $failed = LoginLog::where('logged_at', '>=', $hour->copy()->startOfHour())
                    ->where('logged_at', '<', $hour->copy()->endOfHour())
                    ->where('status', 'failed')->count();
                $hourlyData[] = ['time' => $label, 'success' => $success, 'failed' => $failed];
            }
        }

        return Inertia::render('Security/Index', [
            'login_stats'    => $loginStats,
            'suspicious_ips' => $suspiciousIps,
            'login_history'  => $loginHistory,
            'activities'     => $activities,
            'security_score' => $score,
            'hourly_data'    => $hourlyData,
            'period'         => $period,
            'action_filter'  => $activityFilter ?? '',
        ]);
    }

    /**
     * Hitung Security Score berdasarkan aktivitas dalam periode
     */
    private function calculateSecurityScore(array $stats): int
    {
        $score = 100;

        // Kurangi score berdasarkan jumlah login gagal
        if ($stats['failed'] > 0) {
            $score -= min(30, $stats['failed'] * 2); // max -30
        }

        // Kurangi jika ada IP yang diblokir
        if ($stats['blocked_ips'] > 0) {
            $score -= min(20, $stats['blocked_ips'] * 10); // max -20
        }

        // Kurangi jika banyak IP unik mencoba login
        if ($stats['unique_ips'] > 5) {
            $score -= min(15, ($stats['unique_ips'] - 5) * 3); // max -15
        }

        return max(0, $score);
    }

    /**
     * Ambil list IP yang currently blocked (≥10 gagal dalam 15 menit)
     */
    private function getBlockedIps(): int
    {
        return LoginLog::select('ip_address')
            ->where('status', 'failed')
            ->where('logged_at', '>=', now()->subMinutes(15))
            ->groupBy('ip_address')
            ->havingRaw('COUNT(*) >= 10')
            ->count();
    }
}
