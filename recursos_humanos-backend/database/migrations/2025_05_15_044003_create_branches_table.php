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
        Schema::create('branches', function (Blueprint $table) {
            $table->id('branch_id');
            $table->unsignedBigInteger('company_id');
            $table->string('name', 100);
            $table->string('code', 100)->unique();
            $table->string('address', 100);
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('country', 100);
            $table->string('phone', 10);
            $table->string('email', 100) ->unique();
            $table->boolean('matrix');
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');
            $table->foreign('company_id')->references('company_id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
