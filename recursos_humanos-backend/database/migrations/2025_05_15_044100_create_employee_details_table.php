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
        Schema::create('employee_details', function (Blueprint $table) {
            $table->id('employee_detail_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('schedule_id');
            $table->string('national_id', 10)->unique();
            $table->string('address', 100);
            $table->string('phone', 10);
            $table->date('hire_date');
            $table->date('birth_date');
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('role_id')->on('roles')->onDelete('cascade');
            $table->foreign('department_id')->references('department_id')->on('departments')->onDelete('cascade');
            $table->foreign('schedule_id')->references('schedule_id')->on('schedules')->onDelete('cascade');
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_details');
    }
};
