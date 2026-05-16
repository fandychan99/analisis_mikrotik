<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TrafficController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/live', [DashboardController::class, 'live'])->name('dashboard.live');

    // Devices
    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::post('/devices', [DeviceController::class, 'store'])->name('devices.store');
    Route::put('/devices/{device}', [DeviceController::class, 'update'])->name('devices.update');
    Route::delete('/devices/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');
    Route::post('/devices/test-connection', [DeviceController::class, 'testConnection'])->name('devices.test');
    Route::post('/devices/{device}/poll', [DeviceController::class, 'poll'])->name('devices.poll');

    // Traffic
    Route::get('/traffic', [TrafficController::class, 'index'])->name('traffic.index');
    Route::get('/api/traffic/data', [TrafficController::class, 'data'])->name('traffic.data');

    // Alerts
    Route::get('/alerts', [AlertController::class, 'index'])->name('alerts.index');
    Route::post('/alerts/{alert}/resolve', [AlertController::class, 'resolve'])->name('alerts.resolve');
    Route::post('/alerts/resolve-all', [AlertController::class, 'resolveAll'])->name('alerts.resolve-all');
    Route::post('/alert-rules', [AlertController::class, 'storeRule'])->name('alert-rules.store');
    Route::delete('/alert-rules/{alertRule}', [AlertController::class, 'destroyRule'])->name('alert-rules.destroy');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
