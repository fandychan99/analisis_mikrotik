<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Login Audit Log [S — Security, FCAPS] ──
        Schema::create('login_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('email');                       // Email yang digunakan login
            $table->string('ip_address', 45);             // IPv4 / IPv6
            $table->text('user_agent')->nullable();
            $table->string('browser')->nullable();         // Chrome, Firefox, etc.
            $table->string('platform')->nullable();        // Windows, macOS, etc.
            $table->enum('status', ['success', 'failed'])->default('failed');
            $table->string('failure_reason')->nullable();  // "Invalid credentials", "Account locked"
            $table->string('country')->nullable();         // Opsional: geolocation
            $table->timestamp('logged_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'logged_at']);
            $table->index(['ip_address', 'status', 'logged_at']);
        });

        // ── Activity / Audit Log [S — Security, FCAPS] ──
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_name')->nullable();       // Simpan nama untuk history jika user dihapus
            $table->string('action');                      // 'login', 'logout', 'create_device', 'resolve_alert', dll.
            $table->string('subject_type')->nullable();    // Model class name: Device, Alert, AlertRule
            $table->unsignedBigInteger('subject_id')->nullable(); // ID record yang dimodifikasi
            $table->string('subject_label')->nullable();   // Label untuk display: "MikroTik-01", "Alert #5"
            $table->json('changes')->nullable();           // Before/after JSON
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->enum('severity', ['info', 'warning', 'danger'])->default('info');
            $table->timestamp('performed_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'performed_at']);
            $table->index(['action', 'performed_at']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('login_logs');
    }
};
