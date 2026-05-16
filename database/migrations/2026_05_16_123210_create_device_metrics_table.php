<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->enum('metric_type', [
                'cpu_load',
                'memory_used',
                'memory_total',
                'memory_percent',
                'disk_used',
                'disk_total',
                'disk_percent',
                'if_in_octets',
                'if_out_octets',
                'if_in_bps',
                'if_out_bps',
                'temperature',
                'uptime_seconds',
            ]);
            $table->string('interface_name')->nullable(); // for interface metrics
            $table->decimal('value', 20, 4)->default(0);
            $table->string('unit')->nullable(); // Mbps, %, MB, etc.
            $table->timestamp('recorded_at');
            $table->index(['device_id', 'metric_type', 'recorded_at'], 'dm_device_metric_time_idx');
            $table->index(['device_id', 'interface_name', 'metric_type', 'recorded_at'], 'dm_device_iface_metric_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_metrics');
    }
};
