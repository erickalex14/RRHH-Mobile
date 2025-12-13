<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->string('name', 100);
            $table->time('start_time');
            $table->time('end_time');
            $table->time('lunch_start');
            $table->time('lunch_end');
            $table->boolean('active');
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('user_id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
