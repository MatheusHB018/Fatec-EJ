<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    /**
     * Campos que podem ser preenchidos em massa.
     */
    protected $fillable = [
        'profile_type',
        'name',
        'email',
        'whatsapp',
        'message',
        // Exclusivos para alunos
        'ra',
        'course',
        'period',
    ];

    /**
     * Verifica se o contato é de um aluno.
     */
    public function isStudent(): bool
    {
        return $this->profile_type === 'aluno';
    }
}
