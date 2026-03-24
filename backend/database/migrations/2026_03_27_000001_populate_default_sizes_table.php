<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set a canonical sizes map with zero quantities for products that have NULL sizes
        $default = json_encode([
            'PP' => 0,
            'P' => 0,
            'M' => 0,
            'G' => 0,
            'GG' => 0,
            'XG' => 0,
        ]);

        DB::table('products')->whereNull('sizes')->orWhere('sizes', '')->update(['sizes' => $default]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // noop: we won't revert data changes
    }
};
