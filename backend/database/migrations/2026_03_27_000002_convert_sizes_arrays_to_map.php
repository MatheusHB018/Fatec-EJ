<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $products = DB::table('products')->select('id', 'sizes')->get();

        foreach ($products as $p) {
            $sizes = $p->sizes;
            if (is_null($sizes) || $sizes === '') continue;

            // decode if string
            if (is_string($sizes)) {
                $decoded = json_decode($sizes, true);
                if (json_last_error() === JSON_ERROR_NONE) $sizes = $decoded;
            }

            if (!is_array($sizes)) continue;

            $isAssoc = array_keys($sizes) !== range(0, count($sizes) - 1);
            if ($isAssoc) continue; // already assoc map

            // sequential array -> convert to assoc with qty = 1
            $map = [];
            foreach ($sizes as $entry) {
                if (!is_string($entry)) continue;
                $key = strtoupper(trim($entry));
                if ($key === '') continue;
                $map[$key] = 1;
            }

            if (!empty($map)) {
                DB::table('products')->where('id', $p->id)->update(['sizes' => json_encode($map)]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // noop
    }
};
