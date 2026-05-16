<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_interfaces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->integer('if_index');
            $table->string('if_name')->nullable();
            $table->string('if_desc')->nullable();
            $table->string('if_type')->nullable();
            $table->bigInteger('if_speed')->default(0); // bits per second
            $table->enum('if_oper_status', ['up', 'down', 'testing', 'unknown'])->default('unknown');
            $table->enum('if_admin_status', ['up', 'down', 'testing'])->default('up');
            $table->string('if_phys_address')->nullable(); // MAC address
            $table->bigInteger('in_octets')->default(0);
            $table->bigInteger('out_octets')->default(0);
            $table->bigInteger('in_errors')->default(0);
            $table->bigInteger('out_errors')->default(0);
            $table->timestamp('last_updated_at')->nullable();
            $table->timestamps();
            $table->unique(['device_id', 'if_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_interfaces');
    }
};
