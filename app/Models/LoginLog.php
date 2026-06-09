<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    protected $table = 'login_logs';

    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'browser',
        'platform',
        'status',
        'failure_reason',
        'country',
        'logged_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ── Static helpers ──

    /**
     * Rekam login berhasil
     */
    public static function recordSuccess(int $userId, string $email, \Illuminate\Http\Request $request): void
    {
        [$browser, $platform] = self::parseUserAgent($request->userAgent() ?? '');

        self::create([
            'user_id'     => $userId,
            'email'       => $email,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'browser'     => $browser,
            'platform'    => $platform,
            'status'      => 'success',
            'logged_at'   => now(),
        ]);
    }

    /**
     * Rekam login gagal
     */
    public static function recordFailed(string $email, \Illuminate\Http\Request $request, string $reason = 'Invalid credentials'): void
    {
        [$browser, $platform] = self::parseUserAgent($request->userAgent() ?? '');

        self::create([
            'user_id'        => null,
            'email'          => $email,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'browser'        => $browser,
            'platform'       => $platform,
            'status'         => 'failed',
            'failure_reason' => $reason,
            'logged_at'      => now(),
        ]);
    }

    /**
     * Hitung berapa percobaan gagal dari IP ini dalam N menit terakhir
     */
    public static function countRecentFailures(string $ip, int $minutes = 15): int
    {
        return self::where('ip_address', $ip)
            ->where('status', 'failed')
            ->where('logged_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    /**
     * Parse browser & platform dari user-agent string
     */
    private static function parseUserAgent(string $ua): array
    {
        $browser = 'Unknown';
        $platform = 'Unknown';

        // Browser detection
        if (str_contains($ua, 'Edg/'))       $browser = 'Microsoft Edge';
        elseif (str_contains($ua, 'OPR/'))   $browser = 'Opera';
        elseif (str_contains($ua, 'Chrome'))  $browser = 'Chrome';
        elseif (str_contains($ua, 'Firefox')) $browser = 'Firefox';
        elseif (str_contains($ua, 'Safari'))  $browser = 'Safari';
        elseif (str_contains($ua, 'MSIE') || str_contains($ua, 'Trident')) $browser = 'Internet Explorer';

        // Platform detection
        if (str_contains($ua, 'Windows NT'))       $platform = 'Windows';
        elseif (str_contains($ua, 'Macintosh'))    $platform = 'macOS';
        elseif (str_contains($ua, 'Linux') && !str_contains($ua, 'Android')) $platform = 'Linux';
        elseif (str_contains($ua, 'Android'))      $platform = 'Android';
        elseif (str_contains($ua, 'iPhone') || str_contains($ua, 'iPad')) $platform = 'iOS';

        return [$browser, $platform];
    }
}
