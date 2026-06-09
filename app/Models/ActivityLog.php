<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'subject_type',
        'subject_id',
        'subject_label',
        'changes',
        'ip_address',
        'user_agent',
        'severity',
        'performed_at',
    ];

    protected $casts = [
        'changes'      => 'array',
        'performed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ── Static helper ──

    /**
     * Rekam aktivitas dari request HTTP
     *
     * @param string $action        Kode aksi: 'login', 'logout', 'device.create', 'alert.resolve', dll.
     * @param string $severity      'info' | 'warning' | 'danger'
     * @param array  $context       ['subject_type', 'subject_id', 'subject_label', 'changes']
     */
    public static function record(
        string $action,
        string $severity = 'info',
        array $context = [],
        ?Request $request = null
    ): void {
        $user = auth()->user();

        self::create([
            'user_id'       => $user?->id,
            'user_name'     => $user?->name ?? 'System',
            'action'        => $action,
            'subject_type'  => $context['subject_type'] ?? null,
            'subject_id'    => $context['subject_id']   ?? null,
            'subject_label' => $context['subject_label']?? null,
            'changes'       => $context['changes']       ?? null,
            'ip_address'    => $request?->ip() ?? request()->ip(),
            'user_agent'    => $request?->userAgent() ?? request()->userAgent(),
            'severity'      => $severity,
            'performed_at'  => now(),
        ]);
    }

    // ── Label Mapping untuk display ──
    public static function actionLabel(string $action): string
    {
        return match($action) {
            'login'            => 'Login',
            'logout'           => 'Logout',
            'login.failed'     => 'Login Gagal',
            'device.create'    => 'Tambah Perangkat',
            'device.update'    => 'Ubah Perangkat',
            'device.delete'    => 'Hapus Perangkat',
            'device.poll'      => 'Poll Manual',
            'alert.resolve'    => 'Resolve Alert',
            'alert.resolve_all'=> 'Resolve Semua Alert',
            'alert_rule.create'=> 'Tambah Alert Rule',
            'alert_rule.delete'=> 'Hapus Alert Rule',
            'profile.update'   => 'Update Profil',
            'password.change'  => 'Ganti Password',
            default            => ucfirst(str_replace(['.', '_'], ' ', $action)),
        };
    }

    public static function severityIcon(string $severity): string
    {
        return match($severity) {
            'danger'  => '🔴',
            'warning' => '🟡',
            default   => '🟢',
        };
    }
}
