<?php

use App\Jobs\PollDeviceJob;
use App\Models\Device;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Poll active devices every minute via scheduler
// For more granular polling, the job is also dispatched on demand from frontend
Schedule::call(function () {
    $devices = Device::where('is_active', true)->get();
    foreach ($devices as $device) {
        PollDeviceJob::dispatch($device);
    }
})->everyMinute()->name('poll-snmp-devices')->withoutOverlapping();
