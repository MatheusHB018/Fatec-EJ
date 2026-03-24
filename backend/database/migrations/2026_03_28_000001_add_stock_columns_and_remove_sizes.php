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
        Schema::table('products', function (Blueprint $table) {
            // add per-size stock columns after category
            if (!Schema::hasColumn('products', 'stock_pp')) $table->integer('stock_pp')->default(0)->after('category');
            if (!Schema::hasColumn('products', 'stock_p')) $table->integer('stock_p')->default(0)->after('stock_pp');
            if (!Schema::hasColumn('products', 'stock_m')) $table->integer('stock_m')->default(0)->after('stock_p');
            if (!Schema::hasColumn('products', 'stock_g')) $table->integer('stock_g')->default(0)->after('stock_m');
            if (!Schema::hasColumn('products', 'stock_gg')) $table->integer('stock_gg')->default(0)->after('stock_g');
            if (!Schema::hasColumn('products', 'stock_xg')) $table->integer('stock_xg')->default(0)->after('stock_gg');

            // drop old sizes JSON column if present
            if (Schema::hasColumn('products', 'sizes')) {
                $table->dropColumn('sizes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'sizes')) $table->json('sizes')->nullable()->after('category');
            if (Schema::hasColumn('products', 'stock_xg')) $table->dropColumn('stock_xg');
            if (Schema::hasColumn('products', 'stock_gg')) $table->dropColumn('stock_gg');
            if (Schema::hasColumn('products', 'stock_g')) $table->dropColumn('stock_g');
            if (Schema::hasColumn('products', 'stock_m')) $table->dropColumn('stock_m');
            if (Schema::hasColumn('products', 'stock_p')) $table->dropColumn('stock_p');
            if (Schema::hasColumn('products', 'stock_pp')) $table->dropColumn('stock_pp');
        });
    }
};
