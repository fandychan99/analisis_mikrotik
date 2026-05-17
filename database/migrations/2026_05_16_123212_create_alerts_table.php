<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->string('metric_type'); // cpu_load, memory_percent, interface_down, etc.
            $table->string('interface_name')->nullable();
            $table->enum('severity', ['info', 'warning', 'critical'])->default('warning');
            $table->decimal('threshold_value', 10, 2)->nullable();
            $table->decimal('actual_value', 20, 4)->nullable();
            $table->text('message');
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('triggered_at')->useCurrent();
            $table->timestamps();
        });

        // Alert thresholds configuration table
        Schema::create('alert_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->string('metric_type');
            $table->string('interface_name')->nullable();
            $table->enum('condition', ['gt', 'lt', 'eq'])->default('gt');
            $table->decimal('threshold_value', 10, 2);
            $table->enum('severity', ['info', 'warning', 'critical'])->default('warning');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_rules');
        Schema::dropIfExists('alerts');
    }
};
