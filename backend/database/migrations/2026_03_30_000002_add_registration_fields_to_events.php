<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('category')->nullable()->after('location');
            $table->enum('entry_type', ['gratuita','paga','doacao'])->default('paga')->after('registration_type');
            $table->string('modality')->nullable()->after('entry_type');
            $table->integer('quantity')->default(0)->after('price');
            $table->date('valid_from')->nullable()->after('quantity');
            $table->date('valid_to')->nullable()->after('valid_from');
        });
    }

    public function down()
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['category','entry_type','modality','quantity','valid_from','valid_to']);
        });
    }
};
