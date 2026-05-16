<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ip_address');
            $table->string('snmp_community')->default('public');
            $table->enum('snmp_version', ['1', '2c', '3'])->default('2c');
            $table->integer('snmp_port')->default(161);
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->enum('status', ['online', 'offline', 'unknown'])->default('unknown');
            $table->integer('polling_interval')->default(30); // seconds
            $table->timestamp('last_polled_at')->nullable();
            $table->json('system_info')->nullable(); // sysDescr, sysName, sysUptime, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
