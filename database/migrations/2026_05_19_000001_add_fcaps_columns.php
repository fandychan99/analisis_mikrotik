<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Tambah kolom discards ke device_interfaces ──
        Schema::table('device_interfaces', function (Blueprint $table) {
            $table->unsignedBigInteger('in_discards')->default(0)->after('out_errors');
            $table->unsignedBigInteger('out_discards')->default(0)->after('in_discards');
        });

        // ── 2. Tambah metric types baru ke device_metrics ──
        // SQLite: enum tidak bisa ALTER, pakai workaround string biasa
        // Jika MySQL: gunakan MODIFY COLUMN
        $connection = DB::getDriverName();

        if ($connection === 'mysql') {
            DB::statement("ALTER TABLE device_metrics MODIFY COLUMN metric_type ENUM(
                'cpu_load','memory_used','memory_total','memory_percent',
                'disk_used','disk_total','disk_percent',
                'if_in_octets','if_out_octets','if_in_bps','if_out_bps',
                'temperature','voltage','uptime_seconds',
                'error_rate_in','error_rate_out',
                'packet_drop_in','packet_drop_out'
            )");
        }
        // SQLite: enum sudah disimpan sebagai string, langsung bisa insert nilai baru

        // ── 3. Tabel PPPoE Sessions (Accounting) ──
        Schema::create('pppoe_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->string('username');
            $table->string('interface_name')->nullable();   // e.g. <pppoe-user1>
            $table->string('caller_id')->nullable();        // IP / MAC client
            $table->string('service')->nullable();          // service name
            $table->string('state')->default('active');
            $table->unsignedBigInteger('uptime_seconds')->default(0);
            $table->unsignedBigInteger('rx_bytes')->default(0);
            $table->unsignedBigInteger('tx_bytes')->default(0);
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamps();

            $table->index(['device_id', 'username'], 'pppoe_device_user_idx');
            $table->unique(['device_id', 'username'], 'pppoe_device_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pppoe_sessions');

        Schema::table('device_interfaces', function (Blueprint $table) {
            $table->dropColumn(['in_discards', 'out_discards']);
        });
    }
};
