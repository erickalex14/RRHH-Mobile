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
        Schema::create('documents', function (Blueprint $table) {
            $table->id('document_id');
            $table->unsignedBigInteger('user_id');
            $table->string('file_name', 100);
            $table->string('doc_type', 255);
            $table->string('file_path', 255);
            $table->string('file_size');
            $table->timestamps();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
