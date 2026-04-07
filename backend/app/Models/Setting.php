<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    /**
     * Campos que podem ser preenchidos em massa.
     */
    protected $fillable = [
        'site_name',
        'management_name',
        'hero_title',
        'hero_subtitle',
        'about_text',
        'contact_email',
        'contact_phone',
    ];

    /**
     * Retorna o registro único de configurações.
     * Sempre usa a linha com id=1 (singleton pattern).
     */
    public static function current(): static
    {
        return static::firstOrCreate(['id' => 1], [
            'management_name' => 'Gestão Atual',
        ]);
    }
}
