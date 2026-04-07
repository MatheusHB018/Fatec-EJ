<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'section_name',
        'content',
        'is_active',
        'slug',
        'title',
        'subtitle',
    ];

    protected $casts = [
        'content' => 'array',
        'is_active' => 'boolean',
    ];
}
