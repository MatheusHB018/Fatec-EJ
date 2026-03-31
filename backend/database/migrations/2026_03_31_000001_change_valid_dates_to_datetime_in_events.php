<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE events MODIFY valid_from DATETIME NULL");
        DB::statement("ALTER TABLE events MODIFY valid_to DATETIME NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE events MODIFY valid_from DATE NULL");
        DB::statement("ALTER TABLE events MODIFY valid_to DATE NULL");
    }
};
