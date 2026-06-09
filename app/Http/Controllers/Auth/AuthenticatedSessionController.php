<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use App\Models\LoginLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status'           => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     * [S — Security, FCAPS] Rekam login attempt ke login_logs & activity_logs
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Cek jumlah percobaan gagal dari IP ini
        $recentFailures = LoginLog::countRecentFailures($request->ip(), minutes: 15);

        // Blokir jika sudah ≥ 10 percobaan gagal dalam 15 menit
        if ($recentFailures >= 10) {
            LoginLog::recordFailed($request->email, $request, 'IP blocked — too many failed attempts');
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.',
            ]);
        }

        try {
            $request->authenticate();
        } catch (ValidationException $e) {
            // Rekam login gagal
            LoginLog::recordFailed(
                $request->email,
                $request,
                'Invalid credentials'
            );

            // Rekam di activity log
            ActivityLog::record('login.failed', 'warning', [
                'subject_label' => $request->email,
            ], $request);

            throw $e;
        }

        $request->session()->regenerate();

        $user = Auth::user();

        // Rekam login berhasil
        LoginLog::recordSuccess($user->id, $user->email, $request);

        // Rekam di activity log
        ActivityLog::record('login', 'info', [
            'subject_label' => "Login dari {$request->ip()}",
        ], $request);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     * [S — Security, FCAPS] Rekam logout ke activity_logs
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Rekam logout sebelum auth di-clear
        if (Auth::check()) {
            ActivityLog::record('logout', 'info', [
                'subject_label' => 'Logout dari ' . $request->ip(),
            ], $request);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
