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
        Schema::create('early_departure_requests', function (Blueprint $table) {
            $table->id('request_id');
            $table->unsignedBigInteger('user_id');
            $table->string('description', 100);
            $table->date('request_date');
            $table->time('request_time');
            $table->text('document_path')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('user_id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('early_departure_requests');
    }
};
