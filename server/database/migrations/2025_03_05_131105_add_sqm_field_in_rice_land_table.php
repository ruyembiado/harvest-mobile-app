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
        Schema::table('rice_lands', function (Blueprint $table) {
            $table->string('rice_land_size_sqm')->after('rice_land_size')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rice_lands', function (Blueprint $table) {
            $table->dropColumn('rice_land_size_sqm');
        });
    }
};
