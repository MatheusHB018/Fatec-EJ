<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * Campos que podem ser preenchidos em massa (Mass Assignment).
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'image_url',
        'category',
        'coupon_code',
        'coupon_discount',
        'is_active',
        'sizes',
        'stock_quantity',
    ];

    /**
     * Cast automático de tipos.
     */
    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
        'coupon_discount' => 'decimal:2',
        'sizes' => 'array',
        'stock_quantity' => 'integer',
    ];

    /**
     * Scope: retorna apenas produtos ativos (visíveis na loja pública).
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
