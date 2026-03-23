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
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->enum('profile_type', ['empresa', 'aluno']); // Quem enviou o formulário
            $table->string('name');
            $table->string('email');
            $table->string('whatsapp');
            $table->text('message');

            // Campos exclusivos para Alunos (nullable porque Empresas não preenchem)
            $table->string('ra')->nullable();
            $table->string('course')->nullable();
            $table->string('period')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
