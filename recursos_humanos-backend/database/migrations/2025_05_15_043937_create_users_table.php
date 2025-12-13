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
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->unsignedBigInteger('employee_state_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 100)->unique();
            $table->string('password', 100);
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('employee_state_id')->references('employee_state_id')->on('employee_states');
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
